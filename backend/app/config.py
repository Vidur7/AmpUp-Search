from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    ALGORITHM: str = "HS256"

    app_name: str = "LLMO Analyzer"
    version: str = "0.1.0"
    debug: bool = False

    # Database Settings
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./ampup.db")

    # API Settings
    api_prefix: str = "/api/v1"

    # CORS Settings
    allowed_origins: list = ["*"]

    # Frontend Settings
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Google OAuth Settings
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback"
    )

    # Scoring Weights
    crawlability_weight: float = 0.25
    structured_data_weight: float = 0.25
    content_structure_weight: float = 0.25
    eeat_weight: float = 0.25

    model_config = SettingsConfigDict(env_file=".env")


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
