from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


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


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class AnalysisRequest(BaseModel):
    url: HttpUrl


class AnalysisResponse(BaseModel):
    url: str
    overall_score: float
    crawlability: Dict[str, Any]
    structured_data: Dict[str, Any]
    content_structure: Dict[str, Any]
    eeat: Dict[str, Any]
    recommendations: List[str]
    timestamp: datetime
