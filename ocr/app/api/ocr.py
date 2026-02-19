from fastapi import APIRouter, UploadFile, File, HTTPException
import logging

from app.schemas.ocr import ExtractResponse, ExtractResult
from app.services.ocr_service import OCRService
from app.services.preprocessing import PreprocessingService
from app.services.postprocess import PostprocessService

router = APIRouter()
logger = logging.getLogger(__name__)

preprocessing_service = PreprocessingService()
ocr_service = OCRService()
postprocess_service = PostprocessService()


@router.post("/extract", response_model=ExtractResponse)
async def extract_training_name(
    image: UploadFile = File(..., description="Certificate image")
):
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type: {image.content_type}. Allowed: {allowed_types}"
        )

    try:
        image_bytes = await image.read()

        # --- Extract training name (area tengah) ---
        processed = preprocessing_service.preprocess(image_bytes)
        ocr_result = ocr_service.extract_text(processed)

        normalized = postprocess_service.normalize_text(ocr_result.raw_text)
        status = postprocess_service.determine_status(ocr_result.confidence)

        # --- Extract certificate ID (area kanan atas) ---
        processed_cert = preprocessing_service.preprocess_cert_id(image_bytes)
        cert_id_result = ocr_service.extract_cert_id(processed_cert)

        certificate_id = postprocess_service.normalize_cert_id(cert_id_result.raw_text)

        logger.info(
            f"Training name: '{normalized}' (conf: {ocr_result.confidence:.2f}) | "
            f"Cert ID: '{certificate_id}' (conf: {cert_id_result.confidence:.2f})"
        )

        return ExtractResponse(
            success=True,
            data=ExtractResult(
                training_name=normalized,
                confidence=ocr_result.confidence,
                certificate_id=certificate_id,
                confidence_id=cert_id_result.confidence,
                status=status,
                raw_text=ocr_result.raw_text
            )
        )

    except Exception as e:
        logger.error(f"OCR processing failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(e)}"
        )
