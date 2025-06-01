from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "LLMO Analyzer"
    version: str = "0.1.0"
    debug: bool = False

    # API Settings
    api_prefix: str = "/api/v1"

    # CORS Settings
    allowed_origins: list = ["*"]

    # Scoring Weights
    crawlability_weight: float = 0.25
    structured_data_weight: float = 0.25
    content_structure_weight: float = 0.25
    eeat_weight: float = 0.25

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
