from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: str
    anonymous_id: str
    is_premium: bool = False


class UserCreate(UserBase):
    password: str


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
