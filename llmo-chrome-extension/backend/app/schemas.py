from pydantic import BaseModel, HttpUrl, EmailStr, validator, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
import re


class UserBase(BaseModel):
    email: EmailStr
    anonymous_id: str
    is_premium: bool = False


class UserCreate(UserBase):
    password: str = Field(
        ..., min_length=6, description="Password must be at least 6 characters long"
    )

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")

        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")

        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")

        return v

    @validator("email")
    def validate_email(cls, v):
        # Additional email validation beyond EmailStr
        if not v or len(v.strip()) == 0:
            raise ValueError("Email is required")

        # Check for common invalid patterns
        if ".." in v or v.startswith(".") or v.endswith("."):
            raise ValueError("Invalid email format")

        return v.lower().strip()


class UserResponse(UserBase):
    id: str

    class Config:
        from_attributes = True


class User(UserBase):
    id: UUID
    is_premium: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuditBase(BaseModel):
    url: str


class AuditCreate(AuditBase):
    score: float
    details: Dict[str, Any]


class Audit(AuditBase):
    id: UUID
    user_id: Optional[UUID]
    score: float
    details: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class AnonymousUsageCheck(BaseModel):
    can_analyze: bool
    can_view_full: bool
    analysis_count: int
    full_views_used: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None


class AnalysisRequest(BaseModel):
    url: HttpUrl
    anonymous_id: Optional[str] = None
    include_content: Optional[bool] = True


class AnalysisResponse(BaseModel):
    id: str
    url: str
    overall_score: float
    timestamp: datetime

    class Config:
        from_attributes = True


class UsageStatsResponse(BaseModel):
    analysis_count: int
    full_views_used: int
    is_premium: bool

    class Config:
        from_attributes = True
