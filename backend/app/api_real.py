from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import AnalysisRequest
from app.models import Analysis, AnonymousUsage
from app.services import LLMOAnalyzer
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze")
async def analyze_webpage_real(request: AnalysisRequest, db: Session = Depends(get_db)):
    """Real analyze endpoint using LLMOAnalyzer"""
    logger.info(f"Real analyze called for URL: {request.url}")

    try:
        # Validate URL
        if not str(request.url).startswith(("http://", "https://")):
            return {
                "success": False,
                "error": "Invalid URL",
                "message": "URL must start with http:// or https://",
            }

        # Initialize and run real analyzer
        try:
            analyzer = LLMOAnalyzer(str(request.url))
            result = await analyzer.analyze_page()
            logger.info(f"Analysis completed for {request.url}")
        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": "Analysis failed",
                "message": f"Analysis failed: {str(e)}",
            }

        # Check if analysis was successful
        if not result.get("success", False):
            logger.error(f"Analysis failed for {request.url}: {result.get('error')}")
            return {
                "success": False,
                "error": result.get("error", "Analysis failed"),
                "message": result.get(
                    "message", "The analysis failed. Please try again."
                ),
            }

        # Extract data from analyzer result
        data = result.get("data", result)
        overall_score = data.get("overall_score", 0)
        crawlability = data.get("crawlability", {})
        structured_data = data.get("structured_data", {})
        content_structure = data.get("content_structure", {})
        eeat = data.get("eeat", {})
        recommendations = data.get("recommendations", [])

        # Generate unique ID for this analysis
        analysis_id = str(uuid.uuid4())

        # Save to database
        analysis = Analysis(
            id=analysis_id,
            anonymous_id=request.anonymous_id,
            url=str(request.url),
            overall_score=float(overall_score),
            crawlability=crawlability,
            structured_data=structured_data,
            content_structure=content_structure,
            eeat=eeat,
            recommendations=recommendations,
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
                "overall_score": overall_score,
                "crawlability": crawlability,
                "structured_data": structured_data,
                "content_structure": content_structure,
                "eeat": eeat,
                "recommendations": recommendations,
                "timestamp": datetime.utcnow().isoformat(),
            },
            "message": "Analysis completed successfully",
        }

    except Exception as e:
        logger.error(f"Error in real analyze: {str(e)}", exc_info=True)
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
    return {"message": "Real analyzer API working"}
