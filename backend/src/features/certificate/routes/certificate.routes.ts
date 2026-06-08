import { Router } from 'express';
import fs from 'fs-extra';
import multer from 'multer';
import path from 'path';

import { PrismaService } from '../../../config/prisma.config';
import { auth } from '../../../middleware/auth.middleware';
import { validateRequest } from '../../../middleware/validation.middleware';
import { CertificateController } from '../controllers/certificate.controller';
import { CertificateRepository } from '../repositories/certificate.repository';
import { updateCertificateSchema } from '../schemas/certificate.schema';
import { CertificateService } from '../services/certificate.service';

// Multer configuration for file upload
const uploadDir = path.join(process.cwd(), 'uploads', 'certificates');
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `certificate-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    if (extName && mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg, .png, and .pdf files are allowed'));
    }
  },
});

// Dependency Injection
const prismaService = PrismaService.getInstance();
const prisma = prismaService.client;
const certificateRepository = new CertificateRepository(prisma);
const certificateService = new CertificateService(certificateRepository);
const certificateController = new CertificateController(certificateService);

const router = Router();

// All routes are protected
router.get('/person/:seamanCode', auth, certificateController.getCertificatesBySeamanCode);
router.get('/view/:seamanCode/:nomorSertifikat', auth, certificateController.viewCertificateFile);
router.get(
  '/download/:seamanCode/:nomorSertifikat',
  auth,
  certificateController.downloadCertificateFile,
);
router.get('/:id', auth, certificateController.getCertificateById);
router.post('/', auth, upload.single('file'), certificateController.createCertificate);
router.put(
  '/:id',
  auth,
  validateRequest(updateCertificateSchema),
  certificateController.updateCertificate,
);
router.delete('/:id', auth, certificateController.deleteCertificate);

export default router;
