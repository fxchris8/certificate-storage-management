import { Request, Response, NextFunction } from 'express';
import { ExternalSubmissionService } from '../services/external-submission.service.js';

export class ExternalSubmissionController {
  constructor(private externalSubmissionService: ExternalSubmissionService) {}

  createSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'File is required' });
        return;
      }

      const result = await this.externalSubmissionService.createSubmission(req.body, file);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  getSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await this.externalSubmissionService.getSubmissions(page, limit, status, search);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getSubmissionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.externalSubmissionService.getSubmissionById(id as string);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  };

  approveSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const result = await this.externalSubmissionService.approveSubmission(id as string, req.body, userId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  rejectSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const result = await this.externalSubmissionService.rejectSubmission(id as string, req.body, userId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  getSubmissionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { externalSubmissionId } = req.params;
      const result = await this.externalSubmissionService.getSubmissionStatusByExternalId(externalSubmissionId as string);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  };

  viewFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const raw = req.query.raw === '1';
      const result = await this.externalSubmissionService.viewFile(id as string);

      if (!result.success) {
        res.status(404).json({ success: false, message: result.message });
        return;
      }

      // Override Helmet security headers to allow iframe embedding
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Cross-Origin-Resource-Policy');
      res.setHeader('Content-Security-Policy', "frame-ancestors *; img-src 'self'; style-src 'unsafe-inline'");
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      const ext = result.filePath!.toLowerCase();
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/.test(ext);

      // If raw requested or PDF, serve file directly
      if (raw || !isImage) {
        res.sendFile(result.filePath!);
        return;
      }

      // For images, wrap in HTML with proper sizing
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#f4f4f5;display:flex;align-items:center;justify-content:center}
img{max-width:100%;max-height:100%;object-fit:contain}</style></head>
<body><img src="/api/external-submissions/${id}/view?raw=1" alt="Certificate"/></body></html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      next(error);
    }
  };
}
