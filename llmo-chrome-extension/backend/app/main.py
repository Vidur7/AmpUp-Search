from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, HttpUrl
from app.db import get_db
from app.database import init_db, engine, Base
from app.models import AnonymousUsage, Analysis, User, Audit  # Import all models
from app.services import LLMOAnalyzer
from app.api import router
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
    title=settings.app_name,
    description="API for analyzing webpage optimization for Large Language Models",
    version=settings.version,
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

# Configure CORS - MUST be before including routers
origins = [
    "chrome-extension://*",  # Allow all Chrome extension origins
    "*chrome-extension://*",  # Alternative format
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Log CORS settings
logger.info("Starting application with CORS settings:")
logger.info(f"Allowed origins: {origins}")
logger.info("CORS credentials allowed: True")
logger.info("All methods and headers allowed")

# Constants
FREE_ANALYSIS_LIMIT = 5
FREE_FULL_VIEWS_LIMIT = 2

# Include routers
app.include_router(router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(user.router, prefix="/api/v1/user", tags=["user"])
app.include_router(google_auth.router, prefix="/api/v1/auth", tags=["auth"])


@app.get("/")
async def read_root():
    return {"status": "ok", "message": "LLMO Readiness Auditor API"}


@app.get("/health")
async def health_check():
    return JSONResponse(
        content={"status": "healthy", "version": "0.1.0"}, status_code=200
    )


@app.get("/usage/{anon_id}")
async def get_usage(anon_id: str, db: Session = Depends(get_db)):
    """Get usage statistics for an anonymous user"""
    usage = db.query(AnonymousUsage).filter(AnonymousUsage.anon_id == anon_id).first()
    if not usage:
        usage = AnonymousUsage(anon_id=anon_id)
        db.add(usage)
        db.commit()
    return usage.to_dict()


@app.post(
    "/api/v1/analyze", response_model=None
)  # Remove response_model to allow flexible response
async def analyze_url(request: AnalyzeRequest):
    # Validate URL
    if not validators.url(request.url):
        raise HTTPException(status_code=400, detail="Invalid URL provided")

    try:
        # Return mock data with structure matching what the extension expects
        return {
            "overall_score": 65.0,
            "crawlability": {
                "total_score": 70.0,
                "issues": ["No llms.txt found", "robots.txt is present"],
            },
            "structured_data": {
                "total_score": 60.0,
                "issues": ["Limited schema.org markup", "No product schema"],
            },
            "content_structure": {
                "total_score": 75.0,
                "issues": ["Good heading structure", "Could use more lists"],
            },
            "eeat": {
                "total_score": 55.0,
                "issues": ["No clear author attribution", "Missing publication date"],
            },
            "recommendations": [
                "Add llms.txt file to guide AI crawlers",
                "Implement more schema.org markup",
                "Add author information with proper schema",
                "Include publication date",
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error analyzing URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
