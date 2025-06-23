from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import AnalysisRequest
from app.models import Analysis, AnonymousUsage
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze")
async def analyze_webpage_simple(
    request: AnalysisRequest, db: Session = Depends(get_db)
):
    """Simple analyze endpoint for testing"""
    logger.info(f"Simple analyze called for URL: {request.url}")

    try:
        # Create a simple test analysis
        analysis_id = str(uuid.uuid4())

        # Create test data
        test_data = {
            "overall_score": 75,
            "crawlability": {"total_score": 80, "issues": []},
            "structured_data": {"total_score": 70, "issues": []},
            "content_structure": {"total_score": 75, "issues": []},
            "eeat": {"total_score": 75, "issues": []},
            "recommendations": ["Test recommendation"],
        }

        # Save to database
        analysis = Analysis(
            id=analysis_id,
            anonymous_id=request.anonymous_id,
            url=str(request.url),
            overall_score=75.0,
            crawlability=test_data["crawlability"],
            structured_data=test_data["structured_data"],
            content_structure=test_data["content_structure"],
            eeat=test_data["eeat"],
            recommendations=test_data["recommendations"],
        )

        db.add(analysis)

        # Update usage tracking
        usage = (
            db.query(AnonymousUsage)
            .filter(AnonymousUsage.anonymous_id == request.anonymous_id)
            .first()
        )

        if not usage:
            usage = AnonymousUsage(
                anonymous_id=request.anonymous_id,
                analysis_count=1,
                full_views_used=0,
            )
            db.add(usage)
        else:
            usage.analysis_count += 1

        db.commit()
        db.refresh(analysis)

        return {
            "success": True,
            "data": {
                "id": analysis_id,
                "url": str(request.url),
                "overall_score": 75,
                "crawlability": test_data["crawlability"],
                "structured_data": test_data["structured_data"],
                "content_structure": test_data["content_structure"],
                "eeat": test_data["eeat"],
                "recommendations": test_data["recommendations"],
                "timestamp": datetime.utcnow().isoformat(),
            },
            "message": "Simple test analysis completed successfully",
        }

    except Exception as e:
        logger.error(f"Error in simple analyze: {str(e)}", exc_info=True)
        return {"success": False, "error": "Analysis failed", "message": str(e)}


@router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str, db: Session = Depends(get_db)):
    """Get analysis results by ID"""
    try:
        logger.info(f"Fetching analysis with ID: {analysis_id}")

        # Query the database for the analysis
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()

        if not analysis:
            logger.error(f"Analysis not found with ID: {analysis_id}")
            return {
                "success": False,
                "error": "Analysis not found",
                "message": "The requested analysis could not be found.",
            }

        # Return the analysis data
        return {
            "success": True,
            "data": {
                "id": str(analysis.id),
                "url": analysis.url,
                "overall_score": analysis.overall_score,
                "crawlability": analysis.crawlability,
                "structured_data": analysis.structured_data,
                "content_structure": analysis.content_structure,
                "eeat": analysis.eeat,
                "recommendations": analysis.recommendations,
                "timestamp": analysis.created_at.isoformat(),
            },
        }
    except Exception as e:
        logger.error(f"Error fetching analysis: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": "Failed to fetch analysis",
            "message": str(e),
        }


@router.get("/")
async def root():
    return {"message": "Simple API working"}
