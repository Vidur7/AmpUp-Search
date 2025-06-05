from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import router

app = FastAPI(
    title="LLMO Analyzer",
    description="API for analyzing webpage LLM optimization",
    version="0.1.0",
)

# Configure CORS for specific Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://kipljoblgcgdhnbddmopplbnbdpbomgh",  # Your extension ID
        "http://localhost:8000",  # For local development
        "http://127.0.0.1:8000",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return JSONResponse(
        content={"status": "healthy", "version": "0.1.0"}, status_code=200
    )
