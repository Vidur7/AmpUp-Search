from pydantic import BaseModel, HttpUrl, Field, field_validator
from typing import Dict, List, Optional
from datetime import datetime


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
