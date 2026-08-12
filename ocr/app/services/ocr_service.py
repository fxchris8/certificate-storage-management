import base64
import logging
import re
from typing import Any, ClassVar

from app.config import settings
from app.schemas.ocr import RawOCRResult
from zai import ZaiClient

logger = logging.getLogger(__name__)


class OCRService:
    _EXACT_SKIP: ClassVar[set[str]] = {
        "CERTIFICATE OF PROFICIENCY",
        "CERTIFICATE OF COMPETENCY",
        "SERTIFIKAT KETERAMPILAN",
        "SERTIFIKAT KEAHLIAN",
        "SERTIFIKAT KOMPETENSI",
    }

    _SUBSTRING_SKIP: ClassVar[set[str]] = {
        "KEMENTERIAN PERHUBUNGAN",
        "MINISTRY OF TRANSPORTATION",
        "DIREKTORAT JENDERAL",
        "DIRECTORATE GENERAL",
        "REPUBLIK INDONESIA",
        "REPUBLIC OF INDONESIA",
    }

    _CERT_ID_PATTERN: ClassVar[re.Pattern[str]] = re.compile(
        r"62[\dA-Z]{13,14}", re.IGNORECASE
    )

    def __init__(self):
        logger.info("Initializing ZAI OCR client...")
        self.client = ZaiClient(api_key=settings.ZAI_API_KEY)
        logger.info("ZAI OCR client initialized successfully")

    def extract_text(self, image_bytes: bytes) -> RawOCRResult:
        try:
            markdown = self._run_layout_parsing(image_bytes)
            if not markdown:
                logger.warning("No markdown output from layout parsing")
                return RawOCRResult(raw_text=None, all_blocks=[])

            lines = self._extract_clean_lines(markdown)
            best_text = self._select_best_training_line(lines)

            if not best_text:
                logger.warning("No training-name candidate extracted from OCR markdown")
                return RawOCRResult(raw_text=None, all_blocks=[])

            logger.info("Extracted training text: '%s'", best_text)
            return RawOCRResult(
                raw_text=best_text,
                all_blocks=[{"text": best_text, "bbox": []}],
            )

        except Exception as e:
            logger.error("OCR extraction failed: %s", str(e))
            raise

    def extract_cert_id(self, image_bytes: bytes) -> RawOCRResult:
        try:
            markdown = self._run_layout_parsing(image_bytes)
            if not markdown:
                logger.warning("No markdown output from cert ID OCR")
                return RawOCRResult(raw_text=None, all_blocks=[])

            cert_id = self._extract_cert_id_from_text(markdown)
            if not cert_id:
                logger.warning("No cert ID pattern matched in OCR markdown")
                return RawOCRResult(raw_text=None, all_blocks=[])

            logger.info("Extracted cert ID: '%s'", cert_id)
            return RawOCRResult(
                raw_text=cert_id,
                all_blocks=[{"text": cert_id, "bbox": []}],
            )

        except Exception as e:
            logger.error("Cert ID extraction failed: %s", str(e))
            raise

    def _run_layout_parsing(self, image_bytes: bytes) -> str:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:image/jpeg;base64,{b64}"

        response = self.client.layout_parsing.create(model="glm-ocr", file=data_uri)
        return self._extract_markdown(response)

    def _extract_markdown(self, response: Any) -> str:
        # Common direct cases
        if isinstance(response, str):
            return response.strip()

        for attr in ("output_text", "markdown", "text", "content", "result"):
            value = getattr(response, attr, None)
            if isinstance(value, str) and value.strip():
                return value.strip()

        # Dict/list recursive fallback (SDK structure may vary)
        found = self._find_text_value(response)
        if found:
            return found.strip()

        logger.warning("Could not extract markdown. Raw API response: %s", response)
        return ""

    def _find_text_value(self, value: Any, depth: int = 0) -> str | None:
        if depth > 6 or value is None:
            return None

        if isinstance(value, str):
            return value if value.strip() else None

        if isinstance(value, dict):
            preferred_keys = ["markdown", "output_text", "text", "content", "result"]

            # 1. Coba cari di preferred keys dulu
            for key in preferred_keys:
                if key in value:
                    found = self._find_text_value(value[key], depth + 1)
                    if found:
                        return found

            # 2. Jika tidak ada, telusuri semua value dan gabungkan teks yang ditemukan
            found_texts = []
            for _, v in value.items():
                if isinstance(v, (dict, list, tuple)):
                    found = self._find_text_value(v, depth + 1)
                    if found:
                        found_texts.append(found)

            if found_texts:
                return "\n".join(found_texts)

            return None

        if isinstance(value, (list, tuple)):
            found_texts = []
            for item in value:
                found = self._find_text_value(item, depth + 1)
                if found:
                    found_texts.append(found)

            if found_texts:
                return "\n".join(found_texts)

            return None

        # Pydantic/dataclass-like object fallback
        if hasattr(value, "model_dump"):
            try:
                return self._find_text_value(value.model_dump(), depth + 1)
            except Exception:
                return None

        if hasattr(value, "__dict__"):
            return self._find_text_value(vars(value), depth + 1)

        return None

    def _extract_clean_lines(self, markdown: str) -> list[str]:
        lines: list[str] = []

        for raw_line in markdown.splitlines():
            line = raw_line.strip()
            if not line:
                continue

            # strip basic markdown syntax
            line = re.sub(r"^[#>*\-\s]+", "", line)
            line = re.sub(r"[*#_]+", "", line)
            line = line.replace("`", "")
            line = line.replace("|", " ")
            line = re.sub(r"\s+", " ", line).strip()

            if line:
                lines.append(line)

        return lines

    def _select_best_training_line(self, lines: list[str]) -> str | None:
        candidates = []

        for line in lines:
            text = line.strip()
            # Abaikan baris yang terlalu pendek atau terlalu panjang (berupa paragraf)
            if len(text) < 5 or len(text) > 120:
                continue

            if text.upper() in self._EXACT_SKIP:
                continue

            if any(skip in text.upper() for skip in self._SUBSTRING_SKIP):
                continue

            compact = re.sub(r"\s+", "", text)
            if self._CERT_ID_PATTERN.search(compact):
                continue

            alpha_ratio = sum(c.isalpha() for c in text) / len(text) if text else 0
            if alpha_ratio < 0.5:
                continue

            score = self._training_line_score(text)
            candidates.append((score, text))

        if not candidates:
            # fallback: longest line that still has letters (excluding subtitle skip and paragraphs)
            letter_lines = [
                line
                for line in lines
                if any(c.isalpha() for c in line)
                and line.strip().upper() not in self._EXACT_SKIP
                and not any(
                    skip in line.strip().upper() for skip in self._SUBSTRING_SKIP
                )
                and 5 <= len(line.strip()) <= 120
            ]
            if not letter_lines:
                return None
            return max(letter_lines, key=len)

        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    def _training_line_score(self, text: str) -> float:
        text_upper = text.upper()

        keywords = [
            "TRAINING",
            "SAFETY",
            "BASIC",
            "ADVANCED",
            "KEAHLIAN",
            "AHLI",
            "REVALIDATION",
            "PROFICIENCY IN",
            "OFFICER",
            "MEDICAL",
            "SECURITY",
            "SURVIVAL",
            "RESCUE",
            "TEKNIKA",
            "TEHNIKA",
            "NAUTIKA",
            "MANAGEMENT",
            "MANAJEMEN",
            "CLASS",
            "TINGKAT",
            "OPERASIONAL",
            "OPERATIONAL",
            "ENGINEER",
            "GMDSS",
            "RADIO",
            "OPERATOR",
        ]

        keyword_score = 0.0
        for keyword in keywords:
            if keyword in text_upper:
                keyword_score += 0.3

        keyword_score = min(keyword_score, 1.5)

        alpha_chars = [c for c in text if c.isalpha()]
        upper_ratio = (
            sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)
            if alpha_chars
            else 0.0
        )

        if 0.4 <= upper_ratio <= 0.95:
            case_score = 0.7
        elif upper_ratio > 0.95:
            case_score = 0.4
        else:
            case_score = 0.3

        # Skor panjang teks: nama pelatihan idealnya sekitar 20-60 karakter.
        # Kalimat yang terlalu panjang (misal > 60 karakter) kemungkinan adalah penjelasan.
        l = len(text)
        if l <= 60:
            length_score = l / 60.0
        else:
            # Kurangi skor jika panjangnya melebihi 60 (jatuh ke 0 saat panjangnya mencapai 100)
            length_score = max(1.0 - ((l - 60) / 40.0), 0.0)

        return keyword_score + case_score + length_score

    def _extract_cert_id_from_text(self, text: str) -> str | None:
        cleaned = re.sub(r"\s+", "", text)
        match = self._CERT_ID_PATTERN.search(cleaned)
        if match:
            return match.group(0).upper()

        return None
