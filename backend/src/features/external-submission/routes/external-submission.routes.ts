import { Router } from 'express';
import multer from 'multer';
import path from 'path';

import { fileStorageService } from '../../../config/file-storage.config.js';
import { PrismaService } from '../../../config/prisma.config.js';
import { validateApiKey } from '../../../middleware/api-key.middleware.js';
import { auth } from '../../../middleware/auth.middleware.js';
import { validateRequest } from '../../../middleware/validation.middleware.js';
import { CertificateRepository } from '../../certificate/repositories/certificate.repository.js';
import { PersonRepository } from '../../person/repositories/person.repository.js';
import { ExternalSubmissionController } from '../controllers/external-submission.controller.js';
import { ExternalSubmissionRepository } from '../repositories/external-submission.repository.js';
import {
  approveSubmissionSchema,
  createExternalSubmissionSchema,
  rejectSubmissionSchema,
} from '../schemas/external-submission.schema.js';
import { ExternalSubmissionService } from '../services/external-submission.service.js';

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
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter,
});

const prisma = PrismaService.getInstance().client;
const externalSubmissionRepository = new ExternalSubmissionRepository(prisma);
const certificateRepository = new CertificateRepository(prisma);
const personRepository = new PersonRepository(prisma);
const externalSubmissionService = new ExternalSubmissionService(
  externalSubmissionRepository,
  certificateRepository,
  personRepository,
  fileStorageService,
);
const externalSubmissionController = new ExternalSubmissionController(externalSubmissionService);

const router = Router();

router.post(
  '/',
  validateApiKey,
  upload.single('file'),
  validateRequest(createExternalSubmissionSchema),
  externalSubmissionController.createSubmission,
);

router.get(
  '/status/:externalSubmissionId',
  validateApiKey,
  externalSubmissionController.getSubmissionStatus,
);
router.get('/', auth, externalSubmissionController.getSubmissions);
router.get('/:id', auth, externalSubmissionController.getSubmissionById);
router.get('/:id/view', externalSubmissionController.viewFile);

router.post(
  '/:id/approve',
  auth,
  validateRequest(approveSubmissionSchema),
  externalSubmissionController.approveSubmission,
);

router.post(
  '/:id/reject',
  auth,
  validateRequest(rejectSubmissionSchema),
  externalSubmissionController.rejectSubmission,
);

export default router;
