import cv2
import numpy as np
import logging

from app.config import crop_config

logger = logging.getLogger(__name__)


class PreprocessingService:
    """
    Image preprocessing service for OCR.
    
    Pipeline:
    1. Decode image bytes
    2. Crop to region of interest
    3. Convert to grayscale
    4. Resize for consistent DPI
    5. Apply adaptive threshold
    """
    
    def __init__(self):
        self.target_height = 800  # Resize to this height for consistency
    
    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        # Decode
        image = self._decode_image(image_bytes)
        
        # Crop to region of interest
        cropped = self._crop_roi(image)
        
        # Grayscale
        gray = self._to_grayscale(cropped)
        
        # Resize
        resized = self._resize(gray)
        
        # Threshold
        thresholded = self._apply_threshold(resized)
        
        return thresholded
    
    def _decode_image(self, image_bytes: bytes) -> np.ndarray:
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Failed to decode image")
        
        logger.debug(f"Decoded image shape: {image.shape}")
        return image
    
    def _crop_roi(self, image: np.ndarray) -> np.ndarray:
        """Crop to region of interest where training name appears."""
        height, width = image.shape[:2]
        
        x_start = int(width * crop_config.X_START)
        x_end = int(width * crop_config.X_END)
        y_start = int(height * crop_config.Y_START)
        y_end = int(height * crop_config.Y_END)
        
        cropped = image[y_start:y_end, x_start:x_end]
        
        logger.debug(f"Cropped image: {cropped.shape}")
        return cropped
    
    def _to_grayscale(self, image: np.ndarray) -> np.ndarray:
        if len(image.shape) == 3:
            return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return image
    
    def _resize(self, image: np.ndarray) -> np.ndarray:
        height, width = image.shape[:2]
        
        if height == 0:
            raise ValueError("Image height is 0 after cropping")
        
        scale = self.target_height / height
        new_width = int(width * scale)
        
        resized = cv2.resize(
            image, 
            (new_width, self.target_height), 
            interpolation=cv2.INTER_LINEAR
        )
        
        logger.debug(f"Resized image: {resized.shape}")
        return resized
    
    def _apply_threshold(self, image: np.ndarray) -> np.ndarray:
        denoised = cv2.fastNlMeansDenoising(image, None, h=10, templateWindowSize=7, searchWindowSize=21)

        thresholded = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            15,  
            3    
        )

        return thresholded
    
    def _deskew(self, image: np.ndarray) -> np.ndarray:
        coords = np.column_stack(np.where(image > 0))
        
        if len(coords) < 10:
            return image
        
        angle = cv2.minAreaRect(coords)[-1]
        
        if angle < -45:
            angle = 90 + angle
        
        if abs(angle) < 0.5:
            return image
        
        # Rotate
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image, 
            M, 
            (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        
        logger.debug(f"Deskewed by {angle:.2f} degrees")
        return rotated
