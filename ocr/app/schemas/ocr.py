from pydantic import BaseModel, Field
from typing import Optional, Literal


class OCRTextBlock(BaseModel):
    text: str
    confidence: float
    bbox: list


class RawOCRResult(BaseModel):
    raw_text: Optional[str] = None
    confidence: float = 0.0
    all_blocks: list = []


class ExtractResult(BaseModel):
    training_name: str = Field(..., description="Extracted training name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="OCR confidence")
    status: Literal["auto_approved", "needs_review", "failed"] = Field(..., description="Status")
    raw_text: Optional[str] = Field(None, description="Raw OCR text")


class ExtractResponse(BaseModel):
    success: bool
    data: Optional[ExtractResult] = None
    error: Optional[str] = None
