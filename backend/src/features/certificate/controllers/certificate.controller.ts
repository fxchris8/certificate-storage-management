import { NextFunction, Request, Response } from 'express';
import path from 'path';

import { CertificateService } from '../services/certificate.service';
import { CreateCertificateInput, UpdateCertificateInput, BulkCreateItem } from '../types/certificate.types';

export class CertificateController {
  private certificateService: CertificateService;

  constructor(certificateService: CertificateService) {
    this.certificateService = certificateService;
  }

  getCertificatesBySeamanCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { seamanCode } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const search = req.query.search as string | undefined;

      const result = await this.certificateService.getCertificatesBySeamanCode(seamanCode, { page, limit, search });
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
      if (req.file) updateData.fileUrl = req.file.path;

      const result = await this.certificateService.updateCertificate(id, updateData);
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

      // Handle external URLs (from SPIL) - proxy the request
      if (result.isExternal && result.externalUrl) {
        try {
          const response = await fetch(result.externalUrl);
          if (!response.ok) {
            res.status(404).json({ success: false, message: 'External file not found' });
            return;
          }
          
          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          const buffer = await response.arrayBuffer();
          
          // Override Helmet security headers to allow iframe embedding
          res.removeHeader('X-Frame-Options');
          res.removeHeader('Content-Security-Policy');
          res.removeHeader('Cross-Origin-Resource-Policy');
          res.setHeader('Content-Security-Policy', "frame-ancestors *");
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

          res.setHeader('Content-Type', contentType);
          res.send(Buffer.from(buffer));
        } catch (error) {
          res.status(500).json({ success: false, message: 'Failed to fetch external file' });
        }
        return;
      }

      // Handle local files
      // Override Helmet security headers to allow iframe embedding
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Cross-Origin-Resource-Policy');
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      // Override Helmet security headers to allow iframe embedding
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Cross-Origin-Resource-Policy');
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

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

      // Handle external URLs (from SPIL) - proxy the request
      if (result.isExternal && result.externalUrl) {
        try {
          const response = await fetch(result.externalUrl);
          if (!response.ok) {
            res.status(404).json({ success: false, message: 'External file not found' });
            return;
          }
          
          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          const buffer = await response.arrayBuffer();
          
          // Generate filename from certificate name or nomor sertifikat
          const ext = contentType.includes('pdf') ? 'pdf' : contentType.includes('png') ? 'png' : 'jpg';
          const filename = `${result.certificate?.certificateName || nomorSertifikat}.${ext}`;
          
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(Buffer.from(buffer));
        } catch (error) {
          res.status(500).json({ success: false, message: 'Failed to fetch external file' });
        }
        return;
      }

      // Handle local files
      const fileName = path.basename(result.filePath!);
      res.download(result.filePath!, fileName);
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

  bulkCreateCertificates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
}
