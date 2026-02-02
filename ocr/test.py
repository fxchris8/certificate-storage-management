"""Test OCR extract endpoint logic."""
import json
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from app.services.preprocessing import PreprocessingService
from app.services.ocr_service import OCRService
from app.services.postprocess import PostprocessService


def run_test():
    samples_dir = Path("samples")
    results_dir = Path("results")
    results_dir.mkdir(exist_ok=True)

    preprocessing = PreprocessingService()
    ocr_service = OCRService()
    postprocess = PostprocessService()

    results = []

    for image_path in sorted(samples_dir.glob("*.jpeg")) + sorted(samples_dir.glob("*.jpg")) + sorted(samples_dir.glob("*.png")):
        print(f"Processing: {image_path.name}")

        with open(image_path, "rb") as f:
            image_bytes = f.read()

        processed = preprocessing.preprocess(image_bytes)
        ocr_result = ocr_service.extract_text(processed)

        normalized = postprocess.normalize_text(ocr_result.raw_text)
        status = postprocess.determine_status(ocr_result.confidence)

        result = {
            "filename": image_path.name,
            "training_name": normalized,
            "confidence": round(ocr_result.confidence, 3),
            "status": status,
            "raw_text": ocr_result.raw_text
        }
        results.append(result)

        print(f"  -> {normalized} ({ocr_result.confidence:.1%})")

    output = {
        "timestamp": datetime.now().isoformat(),
        "total_images": len(results),
        "results": results
    }

    output_path = results_dir / "ocr_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    run_test()
