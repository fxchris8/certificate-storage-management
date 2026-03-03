import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { PrismaService } from '../../../config/prisma.config.js';
import { auth } from '../../../middleware/auth.middleware.js';
import { validateApiKey } from '../../../middleware/api-key.middleware.js';
import { validateRequest } from '../../../middleware/validation.middleware.js';
import { ExternalSubmissionController } from '../controllers/external-submission.controller.js';
import { ExternalSubmissionRepository } from '../repositories/external-submission.repository.js';
import { CertificateRepository } from '../../certificate/repositories/certificate.repository.js';
import { ExternalSubmissionService } from '../services/external-submission.service.js';
import { createExternalSubmissionSchema, reviewSubmissionSchema } from '../schemas/external-submission.schema.js';

// Multer configuration for file upload
const uploadDir = path.join(process.cwd(), 'uploads', 'external-submissions');
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `external-cert-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);
  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .jpg, .png, and .pdf files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter,
});

const prisma = PrismaService.getInstance().client;
const externalSubmissionRepository = new ExternalSubmissionRepository(prisma);
const certificateRepository = new CertificateRepository(prisma);
const externalSubmissionService = new ExternalSubmissionService(externalSubmissionRepository, certificateRepository);
const externalSubmissionController = new ExternalSubmissionController(externalSubmissionService);

const router = Router();

router.post(
  '/',
  validateApiKey,
  upload.single('file'),
  validateRequest(createExternalSubmissionSchema),
  externalSubmissionController.createSubmission
);

router.get('/', auth, externalSubmissionController.getSubmissions);
router.get('/:id', auth, externalSubmissionController.getSubmissionById);
router.get('/:id/view', externalSubmissionController.viewFile);

router.post(
  '/:id/approve',
  auth,
  validateRequest(reviewSubmissionSchema),
  externalSubmissionController.approveSubmission
);

router.post(
  '/:id/reject',
  auth,
  validateRequest(reviewSubmissionSchema),
  externalSubmissionController.rejectSubmission
);

export default router;
