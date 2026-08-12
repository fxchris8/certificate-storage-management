from pydantic import BaseModel, Field
from typing import Optional, Literal


class OCRTextBlock(BaseModel):
    text: str
    bbox: list


class RawOCRResult(BaseModel):
    raw_text: Optional[str] = None
    all_blocks: list = []


class ExtractResult(BaseModel):
    training_name: str = Field(..., description="Extracted training name")
    certificate_id: Optional[str] = Field(None, description="Extracted certificate number")
    status: Literal["success", "failed"] = Field(..., description="Status")
    raw_text: Optional[str] = Field(None, description="Raw OCR text")


class ExtractResponse(BaseModel):
    success: bool
    data: Optional[ExtractResult] = None
    error: Optional[str] = None
