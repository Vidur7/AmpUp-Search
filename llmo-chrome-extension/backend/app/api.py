from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from .models import AnalysisRequest, AnalysisResponse
from .services import LLMOAnalyzer
import logging
import asyncio
from fastapi.responses import JSONResponse
from bs4 import BeautifulSoup
import aiohttp
from datetime import datetime
from typing import Dict, Any
from pydantic import ValidationError, BaseModel
import uuid
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Analysis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


class RecommendationRequest(BaseModel):
    url: str
    analysis: Dict[str, Any]


def create_error_response(url: str, error_message: str) -> Dict[str, Any]:
    """Create a properly structured error response"""
    logger.error(f"Creating error response for {url}: {error_message}")
    return {
        "url": url,
        "overall_score": 0,
        "crawlability": {
            "robots_txt_score": 0,
            "llms_txt_score": 0,
            "total_score": 0,
            "issues": ["Failed to access page"],
        },
        "structured_data": {
            "schema_types": [],
            "implementation_score": 0,
            "total_score": 0,
            "issues": ["Failed to access page"],
        },
        "content_structure": {
            "heading_score": 0,
            "list_table_score": 0,
            "conciseness_score": 0,
            "qa_format_score": 0,
            "total_score": 0,
            "issues": ["Failed to access page"],
        },
        "eeat": {
            "author_score": 0,
            "citation_score": 0,
            "originality_score": 0,
            "date_score": 0,
            "total_score": 0,
            "issues": ["Failed to access page"],
        },
        "recommendations": [error_message],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/analyze")
async def analyze_webpage(
    request: AnalysisRequest, db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze a webpage for LLM optimization opportunities
    """
    logger.info(f"Starting analysis for URL: {request.url}")
    try:
        # Create a timeout for the entire operation
        async with asyncio.timeout(30):  # Increased timeout to 30 seconds
            logger.info(f"Initializing analyzer for {request.url}")

            # Validate URL before proceeding
            if not request.url.startswith(("http://", "https://")):
                logger.error(f"Invalid URL format: {request.url}")
                return {
                    "success": False,
                    "error": "Invalid URL",
                    "message": "URL must start with http:// or https://",
                    "data": create_error_response(request.url, "Invalid URL format"),
                }

            try:
                analyzer = LLMOAnalyzer(str(request.url))
            except Exception as e:
                logger.error(f"Failed to initialize analyzer: {str(e)}", exc_info=True)
                return {
                    "success": False,
                    "error": "Initialization failed",
                    "message": f"Failed to initialize analyzer: {str(e)}",
                    "data": create_error_response(
                        request.url, f"Initialization failed: {str(e)}"
                    ),
                }

            logger.info(f"Starting page analysis for {request.url}")
            try:
                result = await analyzer.analyze_page()
                logger.info(f"Analysis completed for {request.url}. Result: {result}")
            except Exception as e:
                logger.error(f"Analysis failed: {str(e)}", exc_info=True)
                return {
                    "success": False,
                    "error": "Analysis failed",
                    "message": f"Analysis failed: {str(e)}",
                    "data": create_error_response(
                        request.url, f"Analysis failed: {str(e)}"
                    ),
                }

            # If the analysis failed, return the error response
            if not result.get("success", False):
                logger.error(
                    f"Analysis failed for {request.url}: {result.get('error')}"
                )
                return {
                    "success": False,
                    "error": result.get("error", "Analysis failed"),
                    "message": result.get(
                        "message", "The analysis failed. Please try again."
                    ),
                    "data": result.get(
                        "data",
                        create_error_response(str(request.url), "Analysis failed"),
                    ),
                }

            # Generate a unique ID for this analysis
            analysis_id = str(uuid.uuid4())

            # Validate the response using Pydantic
            try:
                logger.info(f"Validating response for {request.url}")
                validated_response = AnalysisResponse.model_validate(result)
                logger.info(f"Response validation successful for {request.url}")

                # Create a new Analysis record
                analysis = Analysis(
                    id=analysis_id,
                    anonymous_id=request.anonymous_id,  # This should be passed in the request
                    url=request.url,
                    overall_score=validated_response.overall_score,
                    crawlability=validated_response.crawlability.dict(),
                    structured_data=validated_response.structured_data.dict(),
                    content_structure=validated_response.content_structure.dict(),
                    eeat=validated_response.eeat.dict(),
                    recommendations=validated_response.recommendations,
                )

                # Save to database
                db.add(analysis)
                db.commit()
                db.refresh(analysis)

                # Ensure the response has the correct structure
                response_data = {
                    "id": analysis_id,  # Add the generated ID
                    "url": request.url,
                    "overall_score": validated_response.overall_score,
                    "crawlability": {
                        "total_score": validated_response.crawlability.total_score,
                        "issues": validated_response.crawlability.issues,
                    },
                    "structured_data": {
                        "total_score": validated_response.structured_data.total_score,
                        "issues": validated_response.structured_data.issues,
                    },
                    "content_structure": {
                        "total_score": validated_response.content_structure.total_score,
                        "issues": validated_response.content_structure.issues,
                    },
                    "eeat": {
                        "total_score": validated_response.eeat.total_score,
                        "issues": validated_response.eeat.issues,
                    },
                    "recommendations": validated_response.recommendations,
                    "timestamp": validated_response.timestamp,
                }

                return {
                    "success": True,
                    "data": response_data,
                    "message": "Analysis completed successfully",
                }
            except ValidationError as e:
                logger.error(
                    f"Response validation failed for {request.url}: {str(e)}",
                    exc_info=True,
                )
                return {
                    "success": False,
                    "error": "Internal server error: Response validation failed",
                    "message": "The analysis completed but the response format was invalid",
                    "data": create_error_response(
                        str(request.url),
                        "Internal server error: Response validation failed",
                    ),
                }

    except asyncio.TimeoutError:
        logger.error(f"Analysis timed out for URL {request.url}", exc_info=True)
        return {
            "success": False,
            "error": "Analysis timed out",
            "message": "The page took too long to analyze. Please try again or try a different URL.",
            "data": create_error_response(
                str(request.url),
                "Analysis timed out. The page might be too large or slow to respond.",
            ),
        }
    except aiohttp.ClientError as e:
        logger.error(f"Network error for URL {request.url}: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": "Network error",
            "message": "Could not connect to the target website. Please check the URL and try again.",
            "data": create_error_response(
                str(request.url), f"Failed to fetch the page: {str(e)}"
            ),
        }
    except Exception as e:
        logger.error(
            f"Unexpected error during analysis for URL {request.url}: {str(e)}",
            exc_info=True,
        )
        return {
            "success": False,
            "error": "Analysis failed",
            "message": "An unexpected error occurred during analysis. Please try again.",
            "data": create_error_response(
                str(request.url), f"Analysis failed: {str(e)}"
            ),
        }


@router.post("/analyze/recommendations")
async def generate_recommendations(request: RecommendationRequest) -> Dict[str, Any]:
    """
    Generate AI-powered recommendations based on analysis results
    """
    try:
        # Extract all issues from the analysis
        all_issues = []
        for section in ["crawlability", "structured_data", "content_structure", "eeat"]:
            if section in request.analysis:
                section_data = request.analysis[section]
                if "issues" in section_data:
                    all_issues.extend(section_data["issues"])

        # Generate AI recommendations
        recommendations = []

        # Group issues by type
        issues_by_type = {
            "crawlability": [],
            "structured_data": [],
            "content_structure": [],
            "eeat": [],
        }

        for issue in all_issues:
            if isinstance(issue, dict) and "type" in issue and "text" in issue:
                if issue["type"] == "check-fail":
                    # Determine which section this issue belongs to
                    for section in issues_by_type:
                        if section in issue["text"].lower():
                            issues_by_type[section].append(issue)
                            break

        # Generate recommendations for each section
        for section, issues in issues_by_type.items():
            if issues:
                section_name = section.replace("_", " ").title()
                recommendations.append(f"📊 {section_name} Improvements:")
                for issue in issues:
                    if issue.get("recommendation"):
                        recommendations.append(f"• {issue['recommendation']}")
                    else:
                        recommendations.append(f"• {issue['text']}")

        # Add overall recommendations
        if recommendations:
            recommendations.insert(0, "🎯 Overall Recommendations:")
            recommendations.append("\n💡 Next Steps:")
            recommendations.append("1. Prioritize fixing critical issues first")
            recommendations.append("2. Implement structured data improvements")
            recommendations.append("3. Enhance content structure and readability")
            recommendations.append("4. Strengthen E-E-A-T signals")

        return {"success": True, "recommendations": recommendations}

    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": "Failed to generate recommendations",
            "message": str(e),
        }


@router.get("/")
async def root():
    return {"message": "Welcome to AmpUp Search API"}


@router.get("/analysis/{analysis_id}")
async def get_analysis(
    analysis_id: str, db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get analysis results by ID
    """
    try:
        # Query the database for the analysis
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()

        if not analysis:
            logger.error(f"Analysis not found with ID: {analysis_id}")
            return {
                "success": False,
                "error": "Analysis not found",
                "message": "The requested analysis could not be found. It may have expired or been deleted.",
            }

        # Convert the analysis to the expected response format
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
