from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from app.database import get_db
from app.config import settings
from app.models import User
from app.services.auth import create_access_token
import uuid
import httpx

router = APIRouter()

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth login flow"""
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")

        if not user_info:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://www.googleapis.com/oauth2/v1/userinfo",
                    headers={"Authorization": f"Bearer {token['access_token']}"},
                )
                user_info = resp.json()

        if not user_info.get("email"):
            raise HTTPException(
                status_code=400, detail="Could not get email from Google"
            )

        # Check if user exists
        user = db.query(User).filter(User.email == user_info["email"]).first()

        if not user:
            # Create new user
            user = User(
                email=user_info["email"],
                anonymous_id=str(uuid.uuid4()),
                is_premium=False,
                # We don't set password for Google users
                hashed_password="GOOGLE_AUTH_USER",  # This prevents normal login
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create access token
        access_token = create_access_token(data={"sub": user.email})

        # Redirect to frontend with token
        frontend_url = "http://localhost:3000"  # Update this with your frontend URL
        return RedirectResponse(url=f"{frontend_url}?token={access_token}")

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
