from pydantic import BaseModel, HttpUrl, Field, field_validator
from typing import Dict, List, Optional
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
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .db import Base


class AnalysisRequest(BaseModel):
    url: HttpUrl
    include_content: bool = Field(default=True)


class CrawlabilityScore(BaseModel):
    robots_txt_score: float = Field(ge=0, le=100)
    llms_txt_score: float = Field(ge=0, le=100)
    total_score: float = Field(ge=0, le=100)
    issues: List[str] = Field(default_factory=list)


class StructuredDataScore(BaseModel):
    schema_types: List[str] = Field(default_factory=list)
    implementation_score: float = Field(ge=0, le=100)
    total_score: float = Field(ge=0, le=100)
    issues: List[str] = Field(default_factory=list)


class ContentStructureScore(BaseModel):
    heading_score: float = Field(ge=0, le=100)
    list_table_score: float = Field(ge=0, le=100)
    conciseness_score: float = Field(ge=0, le=100)
    qa_format_score: float = Field(ge=0, le=100)
    total_score: float = Field(ge=0, le=100)
    issues: List[str] = Field(default_factory=list)


class EEATScore(BaseModel):
    author_score: float = Field(ge=0, le=100)
    citation_score: float = Field(ge=0, le=100)
    originality_score: float = Field(ge=0, le=100)
    date_score: float = Field(ge=0, le=100)
    total_score: float = Field(ge=0, le=100)
    issues: List[str] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    url: HttpUrl
    overall_score: float = Field(ge=0, le=100)
    crawlability: CrawlabilityScore
    structured_data: StructuredDataScore
    content_structure: ContentStructureScore
    eeat: EEATScore
    recommendations: List[str] = Field(default_factory=list)
    timestamp: datetime

    @field_validator("overall_score")
    def validate_overall_score(cls, v):
        if not 0 <= v <= 100:
            return 0
        return v


class AnonymousUsage(Base):
    __tablename__ = "anonymous_usage"

    anon_id = Column(String, primary_key=True)
    analysis_count = Column(Integer, default=0)
    full_views_used = Column(Integer, default=0)
    last_used = Column(DateTime, default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "anon_id": self.anon_id,
            "analysis_count": self.analysis_count,
            "full_views_used": self.full_views_used,
            "last_used": self.last_used.isoformat() if self.last_used else None,
        }


class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True)
    password_hash = Column(String)
    is_premium = Column(Boolean, default=False)

    # Relationships
    audits = relationship("Audit", back_populates="user")


class Audit(Base):
    __tablename__ = "audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )  # Nullable for anonymous users
    url = Column(String)
    score = Column(Float)
    details = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="audits")
