import { unifiedResponse } from 'uni-response';
import { ExternalSubmissionRepository } from '../repositories/external-submission.repository.js';
import { CertificateRepository } from '../../certificate/repositories/certificate.repository.js';
import { CreateExternalSubmissionInput, ReviewSubmissionInput } from '../types/external-submission.types.js';
import { SUCCESS, ERROR } from '../../../constants/messages.js';
import { env } from '../../../config/env-config.js';

export class ExternalSubmissionService {
  constructor(
    private externalSubmissionRepository: ExternalSubmissionRepository,
    private certificateRepository: CertificateRepository
  ) {}

  async createSubmission(data: CreateExternalSubmissionInput, file: Express.Multer.File) {
    try {
      // Save file path instead of external URL
      const submissionData = {
        ...data,
        externalFileUrl: file.path, // Save local file path
      };
      
      const submission = await this.externalSubmissionRepository.create(submissionData);
      return unifiedResponse(true, SUCCESS.EXTERNAL_SUBMISSION_CREATED, submission);
    } catch (error) {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async getSubmissions(page?: number, limit?: number, status?: string) {
    try {
      const submissions = await this.externalSubmissionRepository.findAll(page, limit, status);
      
      if (page && limit) {
        const totalCount = await this.externalSubmissionRepository.count(status);
        return unifiedResponse(true, SUCCESS.EXTERNAL_SUBMISSION_FOUND, {
          submissions,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        });
      }

      return unifiedResponse(true, SUCCESS.EXTERNAL_SUBMISSION_FOUND, submissions);
    } catch (error) {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async getSubmissionById(id: string) {
    try {
      const submission = await this.externalSubmissionRepository.findById(id);
      if (!submission) {
        return unifiedResponse(false, ERROR.EXTERNAL_SUBMISSION_NOT_FOUND);
      }
      return unifiedResponse(true, SUCCESS.EXTERNAL_SUBMISSION_FOUND, submission);
    } catch (error) {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async approveSubmission(id: string, data: ReviewSubmissionInput, userId: string) {
    try {
      const submission = await this.externalSubmissionRepository.findById(id);
      if (!submission) {
        return unifiedResponse(false, ERROR.EXTERNAL_SUBMISSION_NOT_FOUND);
      }

      if (submission.status !== 'PENDING') {
        return unifiedResponse(false, ERROR.INVALID_SUBMISSION_STATUS);
      }

      const updated = await this.externalSubmissionRepository.updateStatus(
        id,
        'APPROVED',
        data.reviewNotes,
        userId
      );

      if (submission.personId) {
        await this.certificateRepository.create({
          personId: submission.personId,
          certificateName: submission.certificateName,
          nomorSertifikat: submission.nomorSertifikat,
          fileUrl: submission.externalFileUrl,
        });
      }

      await this.sendCallbackToSpil(submission.externalSubmissionId, 'APPROVED', data.reviewNotes, userId);

      return unifiedResponse(true, SUCCESS.EXTERNAL_SUBMISSION_APPROVED, updated);
    } catch (error) {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async rejectSubmission(id: string, data: ReviewSubmissionInput, userId: string) {
    try {
      const submission = await this.externalSubmissionRepository.findById(id);
      if (!submission) {
        return unifiedResponse(false, ERROR.EXTERNAL_SUBMISSION_NOT_FOUND);
      }

      if (submission.status !== 'PENDING') {
        return unifiedResponse(false, ERROR.INVALID_SUBMISSION_STATUS);
      }

      const updated = await this.externalSubmissionRepository.updateStatus(
        id,
        'REJECTED',
        data.reviewNotes,
        userId
      );

      await this.sendCallbackToSpil(submission.externalSubmissionId, 'REJECTED', data.reviewNotes, userId);

      return unifiedResponse(true, SUCCESS.EXTERNAL_SUBMISSION_REJECTED, updated);
    } catch (error) {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  private async sendCallbackToSpil(externalSubmissionId: string, status: string, reviewNotes: string, reviewedBy: string) {
    if (!env.SPIL_CALLBACK_URL || !env.SPIL_CALLBACK_API_KEY) {
      console.log('Callback skipped: SPIL_CALLBACK_URL or SPIL_CALLBACK_API_KEY not configured');
      return;
    }

    try {
      const response = await fetch(`${env.SPIL_CALLBACK_URL}/${externalSubmissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Callback-Key': env.SPIL_CALLBACK_API_KEY,
        },
        body: JSON.stringify({
          status,
          reviewNotes,
          reviewedBy,
          reviewedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error('Callback to SPIL failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending callback to SPIL:', error);
    }
  }

  async viewFile(id: string) {
    const submission = await this.externalSubmissionRepository.findById(id);
    if (!submission) {
      return { success: false, message: ERROR.EXTERNAL_SUBMISSION_NOT_FOUND };
    }

    const path = await import('path');
    const fs = await import('fs-extra');
    
    const filePath = path.default.resolve(submission.externalFileUrl);
    const exists = await fs.default.pathExists(filePath);
    
    if (!exists) {
      return { success: false, message: 'File not found on server' };
    }

    return { success: true, filePath };
  }
}
