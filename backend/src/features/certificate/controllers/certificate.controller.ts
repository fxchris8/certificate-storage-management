import { NextFunction, Request, Response } from 'express';
import path from 'path';

import { CertificateService } from '../services/certificate.service';
import { CreateCertificateInput, UpdateCertificateInput } from '../types/certificate.types';

export class CertificateController {
  private certificateService: CertificateService;

  constructor(certificateService: CertificateService) {
    this.certificateService = certificateService;
  }

  getCertificatesBySeamanCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { seamanCode } = req.params;
      const result = await this.certificateService.getCertificatesBySeamanCode(seamanCode);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  };

  getCertificateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.certificateService.getCertificateById(id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  };

  createCertificate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'File is required' });
        return;
      }

      const { personId, certificateName, nomorSertifikat } = req.body;
      const fileUrl = file.path;

      const data: CreateCertificateInput = {
        personId,
        certificateName,
        nomorSertifikat,
        fileUrl,
      };

      const result = await this.certificateService.createCertificate(data);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateCertificate = async (
    req: Request<{ id: string }, {}, UpdateCertificateInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.certificateService.updateCertificate(id, req.body);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteCertificate = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.certificateService.deleteCertificate(id);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  viewCertificateFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { seamanCode, nomorSertifikat } = req.params;
      const result = await this.certificateService.viewCertificateFile(seamanCode, nomorSertifikat);

      if (!result.success) {
        res.status(404).json({ success: false, message: result.message });
        return;
      }

      res.sendFile(result.filePath!);
    } catch (error) {
      next(error);
    }
  };

  downloadCertificateFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { seamanCode, nomorSertifikat } = req.params;
      const result = await this.certificateService.downloadCertificateFile(seamanCode, nomorSertifikat);

      if (!result.success) {
        res.status(404).json({ success: false, message: result.message });
        return;
      }

      const fileName = path.basename(result.filePath!);
      res.download(result.filePath!, fileName);
    } catch (error) {
      next(error);
    }
  };
}
