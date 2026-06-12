import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';

import { fileStorageService } from '../../../config/file-storage.config';
import { PrismaService } from '../../../config/prisma.config';
import { auth } from '../../../middleware/auth.middleware';
import { validateRequest } from '../../../middleware/validation.middleware';
import { CertificateController } from '../controllers/certificate.controller';
import { CertificateRepository } from '../repositories/certificate.repository';
import { updateCertificateSchema } from '../schemas/certificate.schema';
import { CertificateService } from '../services/certificate.service';

const filter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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

const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: filter,
});

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: imageFilter,
});

// Dependency Injection
const prismaService = PrismaService.getInstance();
const prisma = prismaService.client;
const certificateRepository = new CertificateRepository(prisma);
const certificateService = new CertificateService(certificateRepository, fileStorageService);
const certificateController = new CertificateController(certificateService);

const router = Router();
const SCAN_ROUTE_TIMEOUT_MS = 10 * 60 * 1000;

const extendRequestTimeout =
  (timeoutMs: number) => (req: Request, res: Response, next: NextFunction) => {
    req.socket.setTimeout(timeoutMs);
    res.socket?.setTimeout(timeoutMs);
    next();
  };

// All routes are protected
router.get('/person/:seafarerCode', auth, certificateController.getCertificatesBySeafarerCode);
router.get('/view/:seafarerCode/:nomorSertifikat', certificateController.viewCertificateFile);
router.get(
  '/download/:seafarerCode/:nomorSertifikat',
  auth,
  certificateController.downloadCertificateFile,
);
router.get('/:id', auth, certificateController.getCertificateById);
router.post('/', auth, uploadFile.single('file'), certificateController.createCertificate);
router.post(
  '/scan',
  auth,
  extendRequestTimeout(SCAN_ROUTE_TIMEOUT_MS),
  uploadMemory.array('files', 20),
  certificateController.scanCertificates,
);
router.post('/bulk', auth, certificateController.bulkCreateCertificates);
router.put('/:id', auth, uploadFile.single('file'), certificateController.updateCertificate);
router.delete('/:id', auth, certificateController.deleteCertificate);

export default router;
