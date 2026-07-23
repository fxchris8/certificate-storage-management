import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';

import { fileStorageService } from '../../../config/file-storage.config.js';
import { PrismaService } from '../../../config/prisma.config.js';
import { auth } from '../../../middleware/auth.middleware.js';
import { crewAuth } from '../../../middleware/crew-auth.middleware.js';
import { validateRequest } from '../../../middleware/validation.middleware.js';
import { CertificateRepository } from '../../certificate/repositories/certificate.repository.js';
import { CertificateService } from '../../certificate/services/certificate.service.js';
import { ExternalSubmissionRepository } from '../../external-submission/repositories/external-submission.repository.js';
import { PersonRepository } from '../../person/repositories/person.repository.js';
import { CrewAuthController } from '../controllers/crew-auth.controller.js';
import { CrewSubmissionController } from '../controllers/crew-submission.controller.js';
import { CrewCredentialRepository } from '../repositories/crew-credential.repository.js';
import { crewLoginSchema } from '../schemas/crew-login.schema.js';
import { crewRegisterSchema } from '../schemas/crew-register.schema.js';
import {createCrewSubmissionSchema,} from '../schemas/crew-submission.schema.js';
import { crewResetPasswordSchema } from '../schemas/crew-reset-password.schema.js';
import { CrewAuthService } from '../services/crew-auth.service.js';
import { CrewSubmissionService } from '../services/crew-submission.service.js';

// ─── Multer: file uploads for submissions ───────────────────────────────────

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

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);
  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .jpg, and .png files are allowed for scanning'));
  }
};

const uploadSubmission = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter,
});

const uploadScan = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: imageFilter,
});

// ─── Timeout helper (mirrors certificate.routes.ts) ─────────────────────────

const SCAN_ROUTE_TIMEOUT_MS = 10 * 60 * 1000;

const extendRequestTimeout =
  (timeoutMs: number) => (req: Request, res: Response, next: NextFunction) => {
    req.socket.setTimeout(timeoutMs);
    res.socket?.setTimeout(timeoutMs);
    next();
  };

// ─── Rate limiters ───────────────────────────────────────────────────────────

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Dependency injection ────────────────────────────────────────────────────

const prisma = PrismaService.getInstance().client;

const personRepository = new PersonRepository(prisma);
const crewCredentialRepository = new CrewCredentialRepository(prisma);
const externalSubmissionRepository = new ExternalSubmissionRepository(prisma);
const certificateRepository = new CertificateRepository(prisma);
const certificateService = new CertificateService(certificateRepository, fileStorageService);

const crewAuthService = new CrewAuthService(crewCredentialRepository, personRepository);
const crewSubmissionService = new CrewSubmissionService(
  externalSubmissionRepository,
  personRepository,
  fileStorageService,
  certificateService,
);

const crewAuthController = new CrewAuthController(crewAuthService);
const crewSubmissionController = new CrewSubmissionController(crewSubmissionService);

// ─── Router ──────────────────────────────────────────────────────────────────

const router = Router();

// Public auth routes (rate-limited)
router.post(
  '/auth/register',
  authRateLimit,
  validateRequest(crewRegisterSchema),
  crewAuthController.register,
);
router.post(
  '/auth/login',
  authRateLimit,
  validateRequest(crewLoginSchema),
  crewAuthController.login,
);

// Crew-protected submission routes
router.get('/submissions', crewAuth, crewSubmissionController.getSubmissions);

router.post(
  '/submissions',
  crewAuth,
  uploadSubmission.single('file'),
  validateRequest(createCrewSubmissionSchema),
  crewSubmissionController.createSubmission,
);

router.post(
  '/submissions/scan',
  crewAuth,
  extendRequestTimeout(SCAN_ROUTE_TIMEOUT_MS),
  uploadScan.array('files', 20),
  crewSubmissionController.scanCertificates,
);

router.delete('/submissions/:id', crewAuth, crewSubmissionController.deleteSubmission);

// Admin-only route (protected by admin auth middleware)
router.post(
  '/admin/reset-password/:personId',
  auth,
  validateRequest(crewResetPasswordSchema),
  crewAuthController.resetPassword,
);

export default router;
