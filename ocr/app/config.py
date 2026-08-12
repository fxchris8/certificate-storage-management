from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DEBUG: bool = True

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5000",
        "http://localhost:8000",
    ]

    ZAI_API_KEY: str

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
