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

logger = logging.getLogger(__name__)
router = APIRouter()


def create_error_response(url: str, error_message: str) -> Dict[str, Any]:
    """Create a properly structured error response"""
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
        "timestamp": datetime.utcnow(),
    }


@router.post("/analyze")
async def analyze_webpage(request: AnalysisRequest) -> Dict[str, Any]:
    """
    Analyze a webpage for LLM optimization opportunities
    """
    try:
        # Create a timeout for the entire operation
        async with asyncio.timeout(15):  # 15 seconds total timeout
            analyzer = LLMOAnalyzer(str(request.url))
            result = await analyzer.analyze_page()

            # Validate the response using Pydantic
            try:
                validated_response = AnalysisResponse(**result)
                return validated_response.dict()
            except ValidationError as e:
                logger.error(f"Response validation failed: {str(e)}")
                return create_error_response(
                    str(request.url),
                    "Internal server error: Response validation failed",
                )

    except asyncio.TimeoutError:
        logger.error(f"Analysis timed out for URL {request.url}")
        return create_error_response(
            str(request.url),
            "Analysis timed out. The page might be too large or slow to respond.",
        )
    except aiohttp.ClientError as e:
        logger.error(f"Network error for URL {request.url}: {str(e)}")
        return create_error_response(
            str(request.url), f"Failed to fetch the page: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Analysis failed for URL {request.url}: {str(e)}")
        return create_error_response(str(request.url), f"Analysis failed: {str(e)}")
