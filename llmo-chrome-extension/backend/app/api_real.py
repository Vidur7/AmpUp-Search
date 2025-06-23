from fastapi import APIRouter, Depends, HTTPException, Header, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import AnalysisRequest
from app.models import Analysis, AnonymousUsage, User
from app.services import LLMOAnalyzer
import uuid
from datetime import datetime
import logging
from typing import Optional, List
from pydantic import BaseModel
import hashlib

logger = logging.getLogger(__name__)
router = APIRouter()


# Request models
class LinkExtensionRequest(BaseModel):
    extension_anonymous_id: str


class SignupRequest(BaseModel):
    name: str = ""  # Make optional with default empty string
    email: str
    password: str
    anonymous_id: str = None
    is_premium: bool = False


class SigninRequest(BaseModel):
    email: str
    password: str


# Helper function to get user from token
async def get_current_user(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
):
    """Get current user from Bearer token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ")[1]

    try:
        # Try JWT token first (for Google OAuth)
        if not token.startswith("user_"):
            # This is likely a JWT token from Google OAuth
            from app.services.auth import verify_token

            email = verify_token(token)
            user = db.query(User).filter(User.email == email).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return user
        else:
            # Simple token format for regular signin: user_{user_id}_{uuid}
            parts = token.split("_")
            if len(parts) < 3:
                raise HTTPException(status_code=401, detail="Invalid token format")

            user_id = parts[1]
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/user/analyses")
async def get_user_analyses(
    limit: int = 50, user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get user's analyses"""
    try:
        # Get analyses for the user's anonymous_id
        analyses = (
            db.query(Analysis)
            .filter(Analysis.anonymous_id == user.anonymous_id)
            .order_by(Analysis.created_at.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": analysis.id,
                "url": analysis.url,
                "overall_score": analysis.overall_score,
                "timestamp": analysis.created_at.isoformat(),
                "crawlability": analysis.crawlability,
                "structured_data": analysis.structured_data,
                "content_structure": analysis.content_structure,
                "eeat": analysis.eeat,
                "recommendations": analysis.recommendations,
            }
            for analysis in analyses
        ]
    except Exception as e:
        logger.error(f"Error fetching user analyses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analyses")


@router.post("/user/link-extension")
async def link_extension(
    request: LinkExtensionRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Link Chrome extension to user account"""
    try:
        # Update user's anonymous_id to match extension
        user.anonymous_id = request.extension_anonymous_id
        db.commit()

        return {
            "success": True,
            "message": "Extension linked successfully",
            "anonymous_id": user.anonymous_id,
        }
    except Exception as e:
        logger.error(f"Error linking extension: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to link extension")


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


# Auth endpoints
@router.post("/auth/signup")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """User signup"""
    try:
        logger.info(
            f"Signup request received: email={request.email}, name='{request.name}', anonymous_id={request.anonymous_id}, is_premium={request.is_premium}"
        )

        # Check if user already exists with this email
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Handle anonymous_id conflicts gracefully
        anonymous_id = request.anonymous_id
        if anonymous_id:
            # Check if another user already has this anonymous_id
            existing_anon_user = (
                db.query(User).filter(User.anonymous_id == anonymous_id).first()
            )
            if existing_anon_user:
                # Generate a new anonymous_id for this user instead of failing
                logger.info(
                    f"Anonymous ID {anonymous_id} already taken by {existing_anon_user.email}, generating new one"
                )
                anonymous_id = str(uuid.uuid4())
        else:
            # Generate new anonymous_id if none provided
            anonymous_id = str(uuid.uuid4())

        # Hash password (simple hashing - in production use proper password hashing)
        hashed_password = hashlib.sha256(request.password.encode()).hexdigest()

        # Create new user
        user = User(
            email=request.email,
            hashed_password=hashed_password,
            anonymous_id=anonymous_id,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        logger.info(
            f"User created successfully: {user.email} with anonymous_id: {user.anonymous_id}"
        )

        return {
            "message": "User created successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "anonymous_id": user.anonymous_id,
                "name": request.name or user.email.split("@")[0],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/auth/signin")
async def signin(
    username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)
):
    """User signin - accepts form data with username/password"""
    try:
        logger.info(f"Signin attempt for email: {username}")

        # Find user (username is actually the email)
        user = db.query(User).filter(User.email == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Verify password (simple comparison - in production use proper password verification)
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        if user.hashed_password != hashed_password:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Generate simple token (in production use JWT)
        token = f"user_{user.id}_{uuid.uuid4()}"

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "anonymous_id": user.anonymous_id,
                "name": user.email.split("@")[0],  # Use email prefix as name
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signin error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/auth/signin-json")
async def signin_json(request: SigninRequest, db: Session = Depends(get_db)):
    """User signin - accepts JSON with email/password"""
    try:
        logger.info(f"JSON signin attempt for email: {request.email}")

        # Find user
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Verify password (simple comparison - in production use proper password verification)
        hashed_password = hashlib.sha256(request.password.encode()).hexdigest()
        if user.hashed_password != hashed_password:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Generate simple token (in production use JWT)
        token = f"user_{user.id}_{uuid.uuid4()}"

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "anonymous_id": user.anonymous_id,
                "name": user.email.split("@")[0],  # Use email prefix as name
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"JSON signin error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": user.id,
        "email": user.email,
        "anonymous_id": user.anonymous_id,
        "name": user.email.split("@")[0],
    }
