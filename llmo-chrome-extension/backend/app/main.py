from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, HttpUrl
from .db import get_db
from .database import init_db
from .models import AnonymousUsage
from .services import LLMOAnalyzer
from .api import router


# Request models
class AnalyzeRequest(BaseModel):
    url: HttpUrl


app = FastAPI(
    title="AmpUp Search",
    description="API for analyzing webpage LLM optimization",
    version="0.1.0",
)


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()


# Configure CORS for specific Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://kipljoblgcgdhnbddmopplbnbdpbomgh",  # Your extension ID
        "http://localhost:8000",  # For local development
        "http://127.0.0.1:8000",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
FREE_ANALYSIS_LIMIT = 5
FREE_FULL_VIEWS_LIMIT = 2

# Include routers
app.include_router(router, prefix="/api/v1")


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


@app.post("/analyze")
async def analyze_url(
    request: AnalyzeRequest,
    x_anonymous_id: Optional[str] = Header(None, alias="X-Anonymous-ID"),
    db: Session = Depends(get_db),
):
    """Analyze a URL and track usage"""
    if not x_anonymous_id:
        raise HTTPException(status_code=400, detail="Anonymous ID required")

    # Get or create usage record
    usage = (
        db.query(AnonymousUsage)
        .filter(AnonymousUsage.anon_id == x_anonymous_id)
        .first()
    )
    if not usage:
        usage = AnonymousUsage(anon_id=x_anonymous_id)
        db.add(usage)

    # Check usage limits
    if usage.analysis_count >= FREE_ANALYSIS_LIMIT:
        return {
            "error": "Free analysis limit reached",
            "limit_reached": True,
            "upgrade_required": True,
        }

    # Perform analysis
    async with LLMOAnalyzer(str(request.url)) as analyzer:
        result = await analyzer.analyze_page()

    # Update usage
    usage.analysis_count += 1
    if usage.full_views_used < FREE_FULL_VIEWS_LIMIT:
        usage.full_views_used += 1
        show_full_results = True
    else:
        show_full_results = False

    db.commit()

    # Return results based on usage
    if show_full_results:
        return {"result": result, "usage": usage.to_dict(), "show_full_results": True}
    else:
        # Return blurred/limited results
        limited_result = {
            "url": result["url"],
            "overall_score": result["overall_score"],
            "preview": True,
            "upgrade_required": True,
        }
        return {
            "result": limited_result,
            "usage": usage.to_dict(),
            "show_full_results": False,
        }
