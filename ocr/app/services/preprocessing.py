import io
import logging

from PIL import Image

logger = logging.getLogger(__name__)


class PreprocessingService:
    """
    Image preprocessing service for OCR.

    Pipeline:
    1. Decode image bytes using Pillow
    2. Return image bytes (JPEG)
    """

    def preprocess(self, image_bytes: bytes) -> bytes:
        image = self._decode_image(image_bytes)
        
        return self._to_jpeg_bytes(image)

    def preprocess_cert_id(self, image_bytes: bytes) -> bytes:
        image = self._decode_image(image_bytes)
        
        return self._to_jpeg_bytes(image)

    def _decode_image(self, image_bytes: bytes) -> Image.Image:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.load()
            logger.debug("Decoded image size: %s", image.size)
            return image
        except Exception as e:
            raise ValueError(f"Failed to decode image: {str(e)}") from e

    def _to_jpeg_bytes(self, image: Image.Image) -> bytes:
        # Ensure compatible mode for JPEG output
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        output = io.BytesIO()
        image.save(output, format="JPEG", quality=95)
        return output.getvalue()
