# Crew Certificate OCR Service

OCR service for extracting training names from crew ship certificates.

## Tech Stack
- FastAPI
- PaddleOCR
- OpenCV


## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

Windows:
```bash
venv\Scripts\activate
```

Linux/Mac:
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configuration (Optional)

```bash
copy .env.example .env
```

Edit `.env` to adjust confidence thresholds if needed.

### 5. Run Server

Development:
```bash
python run.py
```

Production:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 6. Access Testing UI and API Docs

```
http://localhost:8000/test
http://localhost:8000/docs
```

## API Endpoint

### POST /ocr/extract

Extract training name from certificate image.

**Request:**
```
Content-Type: multipart/form-data
Body: image (file)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "training_name": "BASIC SAFETY TRAINING REVALIDATION",
    "confidence": 0.959,
    "status": "auto_approved",
    "raw_text": "BASIC SAFETY TRAINING Revalidation:"
  }
}
```

**Status Values:**
- `auto_approved`: confidence >= 85%
- `needs_review`: confidence >= 60%
- `failed`: confidence < 60%

## Project Structure

```
crew-certificate-ocr/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── api/
│   │   └── ocr.py           # API endpoints
│   ├── services/
│   │   ├── preprocessing.py # Image preprocessing
│   │   ├── ocr_service.py   # PaddleOCR wrapper
│   │   └── postprocess.py   # Text normalization
│   └── schemas/
│       └── ocr.py           # Pydantic models
├── samples/                  # Test images
├── test.py                   # Batch testing script
└── requirements.txt
```

## Testing

Run batch test on all images in `samples/` folder:

```bash
python test.py
```

Results will be saved to `results/ocr_results.json`.

