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

            ".":" ",

            # Roman numeral misreads setelah kata TINGKAT
            "TINGKAT HI ": "TINGKAT III ",
            "TINGKAT HI": "TINGKAT III",
            "TINGKAT H ": "TINGKAT II ",
            "TINGKAT H": "TINGKAT II",
            "TINGKAT 1V": "TINGKAT IV",
            "TINGKAT 1": "TINGKAT I",
        }

        result = text
        for wrong, correct in corrections.items():
            result = result.replace(wrong, correct)

        result = result.replace("BASICSAFETY", "BASIC SAFETY")
        result = result.replace("SAFETYTRAINING", "SAFETY TRAINING")
        result = result.replace("TRAININGREVALIDATION", "TRAINING REVALIDATION")

        result = result.rstrip("'!|1:.")

        return result
    
    def normalize_cert_id(self, raw_text: Optional[str]) -> Optional[str]:
        if not raw_text:
            return None

        cleaned = re.sub(r'\s+', '', raw_text)

        match = re.search(r'62[\dA-Z]{13,14}', cleaned, re.IGNORECASE)
        if match:
            return match.group(0).upper()

        return None

    def determine_status(
        self,
        success: bool
    ) -> Literal["success", "failed"]:
        """
        Determine processing status based on extraction success.
        """
        if success:
            return "success"
        else:
            return "failed"
