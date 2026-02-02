import re
from typing import Literal, Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class PostprocessService:
    def normalize_text(self, text: Optional[str]) -> str:
        if not text:
            return ""
        
        # Uppercase
        normalized = text.upper()
        
        # Replace multiple spaces with single space
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Remove leading/trailing whitespace
        normalized = normalized.strip()
       
        normalized = self._fix_ocr_errors(normalized)
        
        return normalized
    
    def _fix_ocr_errors(self, text: str) -> str:
        corrections = {
            "REVAIIDATION": "REVALIDATION",
            "REVALIDA TION": "REVALIDATION",
            "REVALIDATLON": "REVALIDATION",

            "TRALNING": "TRAINING",
            "TRAI NING": "TRAINING",
            "TRAINLNG": "TRAINING",
            "ATRAINING": "TRAINING",  

            "SAFEIY": "SAFETY",
            "SAFETYA": "SAFETY",
            "SAFETYAT": "SAFETY T",  

            "BASIG": "BASIC",
            "BAS1C": "BASIC",
            "BASIC'": "BASIC",  

            "CERTIF1CATE": "CERTIFICATE",
            "CERTIFI CATE": "CERTIFICATE",
        }

        result = text
        for wrong, correct in corrections.items():
            result = result.replace(wrong, correct)

        result = result.replace("BASICSAFETY", "BASIC SAFETY")
        result = result.replace("SAFETYTRAINING", "SAFETY TRAINING")
        result = result.replace("TRAININGREVALIDATION", "TRAINING REVALIDATION")

        result = result.rstrip("'!I|1:.")

        return result
    
    def determine_status(
        self, 
        confidence: float
    ) -> Literal["auto_approved", "needs_review", "failed"]:
        """
        Determine processing status based on confidence threshold.
        
        Thresholds (from config):
        - >= 0.85: auto_approved
        - >= 0.60: needs_review
        - < 0.60: failed
        """
        if confidence >= settings.CONFIDENCE_AUTO_APPROVE:
            return "auto_approved"
        elif confidence >= settings.CONFIDENCE_NEEDS_REVIEW:
            return "needs_review"
        else:
            return "failed"
