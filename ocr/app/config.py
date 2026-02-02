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
        "http://localhost:8000",  
    ]
    
    OCR_LANG: str = "en"
    OCR_USE_GPU: bool = False

    CONFIDENCE_AUTO_APPROVE: float = 0.85
    CONFIDENCE_NEEDS_REVIEW: float = 0.60
    
    class Config:
        env_file = ".env"
        extra = "ignore"


class CropConfig:
    X_START: float = 0.10 
    X_END: float = 0.90   
    Y_START: float = 0.30 
    Y_END: float = 0.55   


settings = Settings()
crop_config = CropConfig()
