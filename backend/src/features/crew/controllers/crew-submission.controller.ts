import { NextFunction, Request, Response } from 'express';

import { CrewSubmissionService } from '../services/crew-submission.service.js';
import { CreateCrewSubmissionInput } from '../types/crew.types.js';

export class CrewSubmissionController {
  constructor(private crewSubmissionService: CrewSubmissionService) {}

  getSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const personId = req.personId!;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const search = req.query.search ? (req.query.search as string) : undefined;

      const result = await this.crewSubmissionService.getSubmissions(personId, page, limit, search);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createSubmission = async (
    req: Request<object, object, CreateCrewSubmissionInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const personId = req.personId!;
      const file = req.file;

      if (!file) {
        res.status(400).json({ success: false, message: 'File is required' });
        return;
      }

      const result = await this.crewSubmissionService.createSubmission(personId, req.body, file);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const personId = req.personId!;
      const { id } = req.params;

      const result = await this.crewSubmissionService.deleteSubmission(personId, id);
      res.status(result.success ? 200 : 400).json(result);
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

      const result = await this.crewSubmissionService.scanCertificates(files);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };
}
