import { Router } from 'express';
import multer from 'multer';

import { env } from '../../../config/env-config';
import { auth } from '../../../middleware/auth.middleware';

type OcrExtractResponse = {
  success: boolean;
  data?: {
    training_name: string;
    confidence: number;
    status: 'auto_approved' | 'needs_review' | 'failed';
    raw_text?: string | null;
  } | null;
  error?: string | null;
  detail?: string;
  message?: string;
};

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
const allowedImageTypes = new Set(['image/jpeg', 'image/jpg', 'image/png']);

const getOcrServiceUrl = () => env.OCR_SERVICE_URL.replace(/\/+$/, '');

router.post('/extract', auth, upload.single('image'), async (req, res): Promise<void> => {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      message: 'Image is required',
      error: 'Image is required',
    });
    return;
  }

  if (!allowedImageTypes.has(file.mimetype)) {
    res.status(400).json({
      success: false,
      message: 'OCR only supports JPEG and PNG images',
      error: 'OCR only supports JPEG and PNG images',
    });
    return;
  }

  const formData = new FormData();
  const image = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
  formData.append('image', image, file.originalname);

  try {
    const response = await fetch(`${getOcrServiceUrl()}/ocr/extract`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(60_000),
    });
    const payload = (await response.json().catch(() => null)) as OcrExtractResponse | null;

    if (!payload) {
      res.status(502).json({
        success: false,
        message: 'OCR service returned an invalid response',
        error: 'OCR service returned an invalid response',
      });
      return;
    }

    if (!response.ok) {
      const message = payload.message ?? payload.error ?? payload.detail ?? 'OCR extraction failed';
      res.status(response.status).json({
        success: false,
        message,
        error: message,
      });
      return;
    }

    res.status(200).json(payload);
  } catch (error) {
    req.log.error({ err: error }, 'OCR service request failed');
    res.status(502).json({
      success: false,
      message: 'OCR service unavailable',
      error: 'OCR service unavailable',
    });
  }
});

export default router;
