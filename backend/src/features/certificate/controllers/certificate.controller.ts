import { NextFunction, Request, Response } from 'express';

import { CertificateService } from '../services/certificate.service';
import {
  BulkCreateItem,
  CreateCertificateInput,
  UpdateCertificateInput,
} from '../types/certificate.types';

export class CertificateController {
  private certificateService: CertificateService;

  constructor(certificateService: CertificateService) {
    this.certificateService = certificateService;
  }

  getCertificatesBySeafarerCode = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { seafarerCode } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const search = req.query.search as string | undefined;

      const result = await this.certificateService.getCertificatesBySeafarerCode(seafarerCode, {
        page,
        limit,
        search,
      });
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

  createCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'File is required' });
        return;
      }

      const { personId, certificateName, nomorSertifikat } = req.body;

      const data: CreateCertificateInput = {
        personId,
        certificateName,
        nomorSertifikat,
      };

      const result = await this.certificateService.createCertificate(data, file);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateCertificate = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { certificateName, nomorSertifikat } = req.body;
      const updateData: UpdateCertificateInput = {};
      if (certificateName) updateData.certificateName = certificateName;
      if (nomorSertifikat) updateData.nomorSertifikat = nomorSertifikat;

      const result = await this.certificateService.updateCertificate(id, updateData, req.file);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteCertificate = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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
      const { seafarerCode, nomorSertifikat } = req.params;
      const result = await this.certificateService.viewCertificateFile(
        seafarerCode,
        nomorSertifikat,
      );

      if (!result.success) {
        res.status(404).json({ success: false, message: result.message });
        return;
      }

      // Override Helmet security headers to allow iframe embedding
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Cross-Origin-Resource-Policy');
      res.setHeader('Content-Security-Policy', 'frame-ancestors *');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      res.setHeader('Content-Type', result.file!.contentType);
      res.send(result.file!.buffer);
    } catch (error) {
      next(error);
    }
  };

  downloadCertificateFile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { seafarerCode, nomorSertifikat } = req.params;
      const result = await this.certificateService.downloadCertificateFile(
        seafarerCode,
        nomorSertifikat,
      );

      if (!result.success) {
        res.status(404).json({ success: false, message: result.message });
        return;
      }

      const extension = this.getExtensionForContentType(result.file!.contentType);
      const rawFileName = result.certificate?.certificateName || nomorSertifikat;
      const fileName = `${rawFileName.replace(/["\r\n]/g, '_')}.${extension}`;

      res.setHeader('Content-Type', result.file!.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(result.file!.buffer);
    } catch (error) {
      next(error);
    }
  };

  scanCertificates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'At least one file is required' });
        return;
      }

      const results = await this.certificateService.scanCertificates(files);
      res.status(200).json({ success: true, message: 'Scan completed', data: results });
    } catch (error) {
      next(error);
    }
  };

  bulkCreateCertificates = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { items } = req.body as { items: BulkCreateItem[] };
      if (!items || items.length === 0) {
        res.status(400).json({ success: false, message: 'At least one certificate is required' });
        return;
      }

      const result = await this.certificateService.bulkCreateCertificates(items);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  private getExtensionForContentType(contentType: string): string {
    if (contentType.includes('pdf')) return 'pdf';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
    return 'bin';
  }
}
