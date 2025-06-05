from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import validators
from typing import Optional, Dict, Any
from .analyzers import (
    technical_analyzer,
    structured_data_analyzer,
    content_analyzer,
    eeat_analyzer,
)

app = FastAPI(
    title="LLMO Readiness Auditor API",
    description="API for analyzing webpage optimization for Large Language Models",
    version="0.1.0",
)

# Configure CORS for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    url: str
    include_content: Optional[bool] = False


class AnalyzeResponse(BaseModel):
    overall_score: float
    crawlability: Dict[str, Any]
    structured_data: Dict[str, Any]
    content_structure: Dict[str, Any]
    eeat: Dict[str, Any]


@app.get("/")
async def read_root():
    return {"status": "ok", "message": "LLMO Readiness Auditor API"}


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze_url(request: AnalyzeRequest):
    # Validate URL
    if not validators.url(request.url):
        raise HTTPException(status_code=400, detail="Invalid URL provided")

    try:
        # Run all analyzers concurrently
        crawlability_result = await technical_analyzer.analyze(request.url)
        structured_data_result = await structured_data_analyzer.analyze(request.url)
        content_result = await content_analyzer.analyze(request.url)
        eeat_result = await eeat_analyzer.analyze(request.url)

        # Calculate overall score (weighted average)
        weights = {
            "crawlability": 0.25,
            "structured_data": 0.25,
            "content": 0.3,
            "eeat": 0.2,
        }

        overall_score = (
            crawlability_result["total_score"] * weights["crawlability"]
            + structured_data_result["total_score"] * weights["structured_data"]
            + content_result["total_score"] * weights["content"]
            + eeat_result["total_score"] * weights["eeat"]
        )

        return {
            "overall_score": round(overall_score, 2),
            "crawlability": crawlability_result,
            "structured_data": structured_data_result,
            "content_structure": content_result,
            "eeat": eeat_result,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
