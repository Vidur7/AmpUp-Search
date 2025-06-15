from fastapi import APIRouter, HTTPException, BackgroundTasks
from .models import AnalysisRequest, AnalysisResponse
from .services import LLMOAnalyzer
import logging
import asyncio
from fastapi.responses import JSONResponse
from bs4 import BeautifulSoup
import aiohttp
from datetime import datetime
from typing import Dict, Any
from pydantic import ValidationError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


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
async def analyze_webpage(request: AnalysisRequest) -> Dict[str, Any]:
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

            # Validate the response using Pydantic
            try:
                logger.info(f"Validating response for {request.url}")
                validated_response = AnalysisResponse.model_validate(result)
                logger.info(f"Response validation successful for {request.url}")

                # Ensure the response has the correct structure
                response_data = {
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


@router.get("/")
async def root():
    return {"message": "Welcome to AmpUp Search API"}
