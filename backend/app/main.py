from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, HttpUrl
from app.db import get_db
from app.database import init_db, engine, Base
from app.models import AnonymousUsage, Analysis, User, Audit  # Import all models
from app.services import LLMOAnalyzer
from app.api_real import router as api_router
from app.api.v1 import auth, user, google_auth
from app.config import settings
import validators
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Temporarily commented out until analyzers are implemented
# from app.analyzers import (
#     technical_analyzer,
#     structured_data_analyzer,
#     content_analyzer,
#     eeat_analyzer,
# )


# Request models
class AnalyzeRequest(BaseModel):
    url: str
    include_content: Optional[bool] = False


class AnalyzeResponse(BaseModel):
    overall_score: float
    crawlability: Dict[str, Any]
    structured_data: Dict[str, Any]
    content_structure: Dict[str, Any]
    eeat: Dict[str, Any]
    recommendations: List[str] = []


app = FastAPI(
    title="LLMO Readiness Auditor API",
    description="API for analyzing web pages for LLM optimization",
    version="1.0.0",
)


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()


# Create database tables - AFTER importing all models
logger.info("Creating database tables...")
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {str(e)}")
    raise

# Add session middleware for OAuth
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Log CORS settings
logger.info("Starting application with CORS settings:")
logger.info("Allowed origins: *")
logger.info("CORS credentials allowed: True")
logger.info("All methods and headers allowed")

# Constants
FREE_ANALYSIS_LIMIT = 5
FREE_FULL_VIEWS_LIMIT = 2

# Include the API router
app.include_router(api_router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(user.router, prefix="/api/v1/user", tags=["user"])
app.include_router(google_auth.router, prefix="/api/v1/auth", tags=["auth"])


@app.get("/")
async def root():
    return {"message": "Welcome to LLMO Readiness Auditor API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/usage/{anon_id}")
async def get_usage(anon_id: str, db: Session = Depends(get_db)):
    """Get usage statistics for an anonymous user"""
    usage = db.query(AnonymousUsage).filter(AnonymousUsage.anon_id == anon_id).first()
    if not usage:
        usage = AnonymousUsage(anon_id=anon_id)
        db.add(usage)
        db.commit()
    return usage.to_dict()


# Removed duplicate /api/v1/analyze endpoint - using the one in app/api.py instead


@app.get("/debug/anonymous-ids")
async def debug_anonymous_ids(db: Session = Depends(get_db)):
    """Debug endpoint to check anonymous IDs in the system"""
    try:
        # Get all analyses
        analyses = db.query(Analysis).all()
        analysis_ids = [
            {"id": a.id, "anonymous_id": a.anonymous_id, "url": a.url} for a in analyses
        ]

        # Get all users
        users = db.query(User).all()
        user_ids = [{"email": u.email, "anonymous_id": u.anonymous_id} for u in users]

        return {
            "total_analyses": len(analyses),
            "total_users": len(users),
            "analyses": analysis_ids,
            "users": user_ids,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/debug/update-user-anonymous-id")
async def update_user_anonymous_id(
    email: str, new_anonymous_id: str, db: Session = Depends(get_db)
):
    """Debug endpoint to update a user's anonymous_id"""
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        old_anonymous_id = user.anonymous_id
        user.anonymous_id = new_anonymous_id
        db.commit()

        return {
            "success": True,
            "message": f"Updated user {email}",
            "old_anonymous_id": old_anonymous_id,
            "new_anonymous_id": new_anonymous_id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
