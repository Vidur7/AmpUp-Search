from fastapi import APIRouter, HTTPException, Depends, status, Request, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models import User, AnonymousUsage
from app.schemas import UserCreate, UserResponse, TokenResponse
from app.services.auth import (
    authenticate_user,
    create_user,
    create_access_token,
    verify_token,
)
from app.config import settings
from typing import Optional
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


def get_token_from_request(
    request: Request,
    authorization: Optional[str] = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(None),
) -> Optional[str]:
    """Extract token from either Authorization header or cookie"""

    # Try Authorization header first (for dashboard)
    if authorization:
        logger.debug("Found token in Authorization header")
        return authorization

    # Try cookie (for extension with credentials: 'include')
    if access_token:
        logger.debug("Found token in cookie")
        return access_token

    # Try manual extraction from Authorization header (fallback)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[1]
        logger.debug("Manually extracted token from Authorization header")
        return token

    logger.debug("No token found in request")
    return None


async def get_current_user_flexible(
    token: Optional[str] = Depends(get_token_from_request),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Dependency to get current authenticated user - returns None if not authenticated"""
    if not token:
        logger.debug("No token provided - returning None")
        return None

    logger.info("Attempting to get current user from token")
    logger.debug(f"Token received: {token[:10]}...")

    try:
        email = verify_token(token)
        if not email:
            logger.warning("Token verification failed - no email returned")
            return None

        logger.info(f"Token verified for email: {email}")
        user = db.query(User).filter(User.email == email).first()

        if not user:
            logger.error(f"No user found for verified email: {email}")
            return None

        logger.info(
            f"Successfully retrieved user: {email} with anonymous_id: {user.anonymous_id}"
        )
        return user

    except Exception as e:
        logger.warning(f"Token verification failed: {str(e)}")
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user - raises 401 if not authenticated"""
    logger.info("Attempting to get current user from token")
    logger.debug(
        f"Token received: {token[:10]}..."
    )  # Log first 10 chars of token for debugging

    try:
        email = verify_token(token)
        if not email:
            logger.warning("Token verification failed - no email returned")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        logger.info(f"Token verified for email: {email}")
        user = db.query(User).filter(User.email == email).first()

        if not user:
            logger.error(f"No user found for verified email: {email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        logger.info(
            f"Successfully retrieved user: {email} with anonymous_id: {user.anonymous_id}"
        )
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_current_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Sign up a new user and return JWT token"""
    logger.info(f"Attempting to create new user with email: {user_data.email}")
    try:
        user = create_user(db, user_data)
        logger.info(f"Successfully created user with email: {user_data.email}")

        # Create JWT token for the new user
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        logger.info(f"Generated JWT token for new user: {user_data.email}")
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                anonymous_id=user.anonymous_id,
                is_premium=user.is_premium,
            ),
        )
    except HTTPException as e:
        logger.error(f"Failed to create user: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        )


@router.post("/signin", response_model=TokenResponse)
async def signin(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """Sign in a user"""
    logger.info(f"Attempting to authenticate user: {form_data.username}")
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logger.warning(f"Authentication failed for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        logger.info(f"Successfully authenticated user: {form_data.username}")
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                anonymous_id=user.anonymous_id,
                is_premium=user.is_premium,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during signin: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during signin",
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_endpoint(current_user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return current_user
