from pydantic import BaseModel, HttpUrl, Field, field_validator
from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .db import Base


class AnalysisRequest(BaseModel):
    url: str = Field(..., description="The URL to analyze")
    include_content: bool = Field(default=True)
    anonymous_id: str = Field(..., description="The anonymous ID of the user")


class CrawlabilityScore(BaseModel):
    robots_txt_score: float = Field(..., ge=0, le=100)
    llms_txt_score: float = Field(..., ge=0, le=100)
    total_score: float = Field(..., ge=0, le=100)
    issues: List[str] = Field(default_factory=list)


class StructuredDataScore(BaseModel):
    schema_types: List[str] = Field(default_factory=list)
    implementation_score: float = Field(..., ge=0, le=100)
    total_score: float = Field(..., ge=0, le=100)
    issues: List[str] = Field(default_factory=list)


class ContentStructureScore(BaseModel):
    heading_score: float = Field(..., ge=0, le=100)
    list_table_score: float = Field(..., ge=0, le=100)
    conciseness_score: float = Field(..., ge=0, le=100)
    qa_format_score: float = Field(..., ge=0, le=100)
    total_score: float = Field(..., ge=0, le=100)
    issues: List[str] = Field(default_factory=list)


class EEATScore(BaseModel):
    author_score: float = Field(..., ge=0, le=100)
    citation_score: float = Field(..., ge=0, le=100)
    originality_score: float = Field(..., ge=0, le=100)
    date_score: float = Field(..., ge=0, le=100)
    total_score: float = Field(..., ge=0, le=100)
    issues: List[str] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    url: str
    overall_score: float = Field(..., ge=0, le=100)
    crawlability: CrawlabilityScore
    structured_data: StructuredDataScore
    content_structure: ContentStructureScore
    eeat: EEATScore
    recommendations: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    anonymous_id = Column(String, nullable=False, index=True)
    url = Column(String, nullable=False)
    overall_score = Column(Float, nullable=False)
    crawlability = Column(JSON)
    structured_data = Column(JSON)
    content_structure = Column(JSON)
    eeat = Column(JSON)
    recommendations = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class AnonymousUsage(Base):
    __tablename__ = "anonymous_usage"

    id = Column(Integer, primary_key=True)
    anonymous_id = Column(String, nullable=False, unique=True)
    analysis_count = Column(Integer, default=0)
    full_views_used = Column(Integer, default=0)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "anonymous_id": self.anonymous_id,
            "analysis_count": self.analysis_count,
            "full_views_used": self.full_views_used,
            "is_premium": self.is_premium,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    anonymous_id = Column(String, unique=True, nullable=False)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    audits = relationship("Audit", back_populates="user")


class Audit(Base):
    __tablename__ = "audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        String, ForeignKey("users.id"), nullable=True
    )  # Nullable for anonymous users
    url = Column(String)
    score = Column(Float)
    details = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="audits")


class UsageStatsResponse(BaseModel):
    analysis_count: int
    full_views_used: int
    is_premium: bool

    class Config:
        from_attributes = True


class AnalyzeResponse(BaseModel):
    id: str
    overall_score: float
    crawlability: Dict[str, Any]
    structured_data: Dict[str, Any]
    content_structure: Dict[str, Any]
    eeat: Dict[str, Any]
    recommendations: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
