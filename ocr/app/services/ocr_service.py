from paddleocr import PaddleOCR
import numpy as np
import re
from typing import List
import logging

from app.config import settings
from app.schemas.ocr import RawOCRResult

logger = logging.getLogger(__name__)


class OCRService:    
    def __init__(self):
        logger.info("Initializing PaddleOCR...")
        
        self.ocr = PaddleOCR(
            use_angle_cls=True,      
            lang=settings.OCR_LANG,  
            use_gpu=settings.OCR_USE_GPU,
            show_log=False           
        )
        
        logger.info("PaddleOCR initialized successfully")
    
    def extract_text(self, image: np.ndarray) -> RawOCRResult:
        try:
            results = self.ocr.ocr(image, cls=True)
            
            if not results or not results[0]:
                logger.warning("No text detected in image")
                return RawOCRResult(
                    raw_text=None,
                    confidence=0.0,
                    all_blocks=[]
                )
            
            text_blocks = self._parse_results(results[0])
            
            if not text_blocks:
                return RawOCRResult(
                    raw_text=None,
                    confidence=0.0,
                    all_blocks=[]
                )
            
            best_block = self._select_best_block(text_blocks)
            
            logger.info(f"Extracted: '{best_block['text']}' (conf: {best_block['confidence']:.2f})")
            
            return RawOCRResult(
                raw_text=best_block["text"],
                confidence=best_block["confidence"],
                all_blocks=text_blocks
            )
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            raise
    
    def _parse_results(self, ocr_results: list) -> List[dict]:
    
        text_blocks = []
        
        for item in ocr_results:
            if len(item) != 2:
                continue
                
            bbox_points, text_conf = item
            text, confidence = text_conf
            
            # Calculate bounding box area for ranking
            x_coords = [p[0] for p in bbox_points]
            y_coords = [p[1] for p in bbox_points]
            
            width = max(x_coords) - min(x_coords)
            height = max(y_coords) - min(y_coords)
            area = width * height
            
            text_blocks.append({
                "text": text,
                "confidence": confidence,
                "bbox": bbox_points,
                "area": area,
                "width": width,
                "height": height
            })
        
        return text_blocks
    
    def _select_best_block(self, text_blocks: List[dict]) -> dict:

        candidates = []
        
        for block in text_blocks:
            text = block["text"].strip()
            
            # Skip very short text
            if len(text) < 5:
                continue
            
            # Skip text that's mostly numbers
            alpha_ratio = sum(c.isalpha() for c in text) / len(text) if text else 0
            if alpha_ratio < 0.5:
                continue
            
            # Calculate score
            score = self._calculate_block_score(block)
            block["score"] = score
            candidates.append(block)
        
        if not candidates:
            # Fallback: return largest block
            return max(text_blocks, key=lambda x: x["area"])
        
        return max(candidates, key=lambda x: x["score"])
    
    def _calculate_block_score(self, block: dict) -> float:
        """
        Calculate ranking score for a text block.
        
        Factors:
        - Confidence (weight: 0.3)
        - Area/size (weight: 0.3)
        - Uppercase ratio (weight: 0.2)
        - Contains training keywords (weight: 0.2)
        """
        text = block["text"]
        confidence = block["confidence"]
        area = block["area"]
        
        area_score = min(area / 500000, 1.0)
        
        # Uppercase ratio
        upper_count = sum(1 for c in text if c.isupper())
        upper_ratio = upper_count / len(text) if text else 0
        
        keywords = ["TRAINING", "SAFETY", "BASIC", "ADVANCED", "CERTIFICATE"]
        keyword_score = 0.0
        text_upper = text.upper()
        for keyword in keywords:
            if keyword in text_upper:
                keyword_score += 0.2
        keyword_score = min(keyword_score, 1.0)
        
        # Weighted score
        score = (
            confidence * 0.3 +
            area_score * 0.3 +
            upper_ratio * 0.2 +
            keyword_score * 0.2
        )

        return score

    def extract_cert_id(self, image: np.ndarray) -> RawOCRResult:
        cert_pattern = re.compile(r'62\d{13,14}')

        try:
            results = self.ocr.ocr(image, cls=True)

            if not results or not results[0]:
                logger.warning("No text detected in cert ID region")
                return RawOCRResult(raw_text=None, confidence=0.0, all_blocks=[])

            text_blocks = self._parse_results(results[0])

            if not text_blocks:
                return RawOCRResult(raw_text=None, confidence=0.0, all_blocks=[])

            best_block = None
            best_confidence = 0.0

            for block in text_blocks:
                cleaned = re.sub(r'\s+', '', block["text"])
                if cert_pattern.search(cleaned):
                    if block["confidence"] > best_confidence:
                        best_block = block
                        best_confidence = block["confidence"]

            if best_block:
                logger.info(f"Cert ID found: '{best_block['text']}' (conf: {best_block['confidence']:.2f})")
                return RawOCRResult(
                    raw_text=best_block["text"],
                    confidence=best_block["confidence"],
                    all_blocks=text_blocks
                )

            logger.warning("No cert ID pattern matched in region")
            return RawOCRResult(raw_text=None, confidence=0.0, all_blocks=text_blocks)

        except Exception as e:
            logger.error(f"Cert ID extraction failed: {str(e)}")
            raise
