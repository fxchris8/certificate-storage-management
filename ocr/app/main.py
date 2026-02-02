from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.api import ocr
from app.config import settings

app = FastAPI(
    title="Crew Certificate OCR Service",
    description="OCR service for extracting training names from crew certificates",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware 
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr.router, prefix="/ocr", tags=["OCR"])


@app.get("/")
async def root():
    return {
        "service": "Crew Certificate OCR",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/test")
async def test_ui():
    return FileResponse(Path(__file__).parent.parent / "static" / "index.html")
