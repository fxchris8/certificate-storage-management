import path from 'path';
import { unifiedResponse } from 'uni-response';

import { ERROR, SUCCESS } from '../../../constants/messages.js';
import { FileStorageService } from '../../../services/file-storage.service.js';
import { CertificateRepository } from '../../certificate/repositories/certificate.repository.js';
import { PersonRepository } from '../../person/repositories/person.repository.js';
import { ExternalSubmissionRepository } from '../repositories/external-submission.repository.js';
import {
  CreateExternalSubmissionInput,
  ReviewSubmissionInput,
} from '../types/external-submission.types.js';

export class ExternalSubmissionService {
  constructor(
    private externalSubmissionRepository: ExternalSubmissionRepository,
    private certificateRepository: CertificateRepository,
    private personRepository: PersonRepository,
    private fileStorageService: FileStorageService,
  ) {}

  async createSubmission(data: CreateExternalSubmissionInput, file: Express.Multer.File) {
    const externalFileUrl = await this.fileStorageService.upload(
      file,
      this.createFileName(
        data.seafarerCode,
        data.certificateName,
        data.nomorSertifikat,
        file.originalname,
      ),
    );

    try {
      const submissionData = {
        ...data,
        externalFileUrl,
      };

      const submission = await this.externalSubmissionRepository.create(submissionData);
      return unifiedResponse(true, SUCCESS.EXTERNAL_SUBMISSION_CREATED, submission);
    } catch (error) {
      await this.fileStorageService.delete(externalFileUrl).catch(cleanupError => {
        console.error('Failed to roll back external submission upload:', cleanupError);
      });
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async getSubmissions(page?: number, limit?: number, status?: string, search?: string) {
    try {
      const submissions = await this.externalSubmissionRepository.findAll(
        page,
        limit,
        status,
        search,
      );

      if (page && limit) {
        const totalCount = await this.externalSubmissionRepository.count(status, search);
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

      // Find or create person by seafarerCode
      let personId: string = submission.personId ?? '';
      if (!personId) {
        const existing = await this.personRepository.findBySeafarerCode(submission.seafarerCode);
        if (existing) {
          personId = existing.id;
        } else {
          const newPerson = await this.personRepository.create({
            name: submission.seafarerName,
            seafarercode: submission.seafarerCode,
          });
          personId = newPerson.id;
        }
      }

      const updated = await this.externalSubmissionRepository.updateStatus(
        id,
        'APPROVED',
        data.reviewNotes,
        userId,
        personId,
      );

      await this.certificateRepository.create({
        personId,
        certificateName: submission.certificateName,
        nomorSertifikat: submission.nomorSertifikat,
        fileUrl: submission.externalFileUrl,
      });

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
        userId,
      );

      return unifiedResponse(true, SUCCESS.EXTERNAL_SUBMISSION_REJECTED, updated);
    } catch (error) {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async getSubmissionStatusByExternalId(externalSubmissionId: string) {
    try {
      const submission =
        await this.externalSubmissionRepository.findByExternalSubmissionId(externalSubmissionId);
      if (!submission) {
        return unifiedResponse(false, ERROR.EXTERNAL_SUBMISSION_NOT_FOUND);
      }
      return unifiedResponse(true, SUCCESS.EXTERNAL_SUBMISSION_FOUND, {
        externalSubmissionId: submission.externalSubmissionId,
        status: submission.status,
        reviewNotes: submission.reviewNotes,
        reviewedBy: submission.reviewedBy,
        reviewedAt: submission.reviewedAt,
      });
    } catch (error) {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async viewFile(id: string) {
    const submission = await this.externalSubmissionRepository.findById(id);
    if (!submission) {
      return { success: false, message: ERROR.EXTERNAL_SUBMISSION_NOT_FOUND };
    }

    try {
      const file = await this.fileStorageService.read(submission.externalFileUrl);
      return { success: true, file };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Submission file could not be read',
      };
    }
  }

  private createFileName(
    seafarerCode: string,
    certificateName: string,
    nomorSertifikat: string,
    originalName: string,
  ): string {
    const extension = path.extname(originalName).toLowerCase();
    const baseName = `${seafarerCode}-${certificateName}-${nomorSertifikat}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);

    return `${baseName || 'external-certificate'}${extension}`;
  }
}
