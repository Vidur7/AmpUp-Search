from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Analysis, AnonymousUsage, User
from app.schemas import AnalysisResponse, UsageStatsResponse
from app.api.v1.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/analyses", response_model=List[AnalysisResponse])
async def get_user_analyses(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all analyses for a user"""
    try:
        logger.info("Attempting to fetch user analyses")

        if not current_user:
            logger.error("No current user found in get_user_analyses")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        logger.info(f"Current user found: {current_user.email}")

        if not current_user.anonymous_id:
            logger.error(f"User {current_user.email} has no anonymous_id")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has no anonymous ID",
            )

        logger.info(
            f"Fetching analyses for user with anonymous_id: {current_user.anonymous_id}"
        )

        analyses = (
            db.query(Analysis)
            .filter(Analysis.anonymous_id == current_user.anonymous_id)
            .all()
        )

        logger.info(f"Found {len(analyses)} analyses for user")

        if len(analyses) == 0:
            logger.info(
                "No analyses found for user - this might be normal for new users"
            )

        return [
            AnalysisResponse(
                id=str(analysis.id),
                url=analysis.url,
                overall_score=analysis.overall_score,
                timestamp=analysis.created_at,
            )
            for analysis in analyses
        ]
    except HTTPException as he:
        logger.error(f"HTTP Exception in get_user_analyses: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Error fetching analyses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analyses: {str(e)}",
        )


@router.get("/usage", response_model=UsageStatsResponse)
async def get_user_usage(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get usage statistics for a user"""
    try:
        if not current_user:
            logger.error("No current user found in get_user_usage")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        if not current_user.anonymous_id:
            logger.error(f"User {current_user.email} has no anonymous_id")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has no anonymous ID",
            )

        logger.info(
            f"Fetching usage stats for user with anonymous_id: {current_user.anonymous_id}"
        )

        usage = (
            db.query(AnonymousUsage)
            .filter(AnonymousUsage.anonymous_id == current_user.anonymous_id)
            .first()
        )

        if not usage:
            logger.info("No usage record found, creating default response")
            return UsageStatsResponse(
                analysis_count=0, full_views_used=0, is_premium=current_user.is_premium
            )

        logger.info(
            f"Found usage stats: analyses={usage.analysis_count}, views={usage.full_views_used}"
        )
        return UsageStatsResponse(
            analysis_count=usage.analysis_count,
            full_views_used=usage.full_views_used,
            is_premium=current_user.is_premium,
        )
    except HTTPException as he:
        logger.error(f"HTTP Exception in get_user_usage: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Error fetching usage stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch usage statistics: {str(e)}",
        )
