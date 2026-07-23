import path from 'path';
import { randomUUID } from 'crypto';
import { unifiedResponse } from 'uni-response';

import { ERROR, SUCCESS } from '../../../constants/messages.js';
import { FileStorageService } from '../../../services/file-storage.service.js';
import { CertificateService } from '../../certificate/services/certificate.service.js';
import { ExternalSubmissionRepository } from '../../external-submission/repositories/external-submission.repository.js';
import { PersonRepository } from '../../person/repositories/person.repository.js';
import { CreateCrewSubmissionInput } from '../types/crew.types.js';

export class CrewSubmissionService {
  constructor(
    private externalSubmissionRepository: ExternalSubmissionRepository,
    private personRepository: PersonRepository,
    private fileStorageService: FileStorageService,
    private certificateService: CertificateService,
  ) {}

  async getSubmissions(personId: string, page?: number, limit?: number, search?: string) {
    try {
      const submissions = await this.externalSubmissionRepository.findAll(
        page,
        limit,
        undefined,
        search,
        personId,
      );

      if (page && limit) {
        const totalCount = await this.externalSubmissionRepository.count(
          undefined,
          search,
          personId,
        );
        return unifiedResponse(true, SUCCESS.CREW_SUBMISSION_FOUND, {
          submissions,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        });
      }

      return unifiedResponse(true, SUCCESS.CREW_SUBMISSION_FOUND, submissions);
    } catch {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async createSubmission(
    personId: string,
    data: CreateCrewSubmissionInput,
    file: Express.Multer.File,
  ) {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      return unifiedResponse(false, ERROR.PERSON_NOT_FOUND);
    }

    const externalSubmissionId = randomUUID();
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = `${person.seafarercode}-${data.certificateName}-${data.nomorSertifikat}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);
    const fileName = `${baseName || 'crew-certificate'}${extension}`;

    const externalFileUrl = await this.fileStorageService.upload(file, fileName);

    try {
      const submission = await this.externalSubmissionRepository.create({
        externalSubmissionId,
        seafarerCode: person.seafarercode,
        seafarerName: person.name,
        certificateName: data.certificateName,
        nomorSertifikat: data.nomorSertifikat,
        externalFileUrl,
        personId,
      });
      return unifiedResponse(true, SUCCESS.CREW_SUBMISSION_CREATED, submission);
    } catch (error) {
      await this.fileStorageService.delete(externalFileUrl).catch(cleanupError => {
        console.error('Failed to roll back crew submission upload:', cleanupError);
      });
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteSubmission(personId: string, submissionId: string) {
    try {
      const submission = await this.externalSubmissionRepository.findById(submissionId);

      if (!submission) {
        return unifiedResponse(false, ERROR.CREW_SUBMISSION_NOT_FOUND);
      }

      if (submission.personId !== personId) {
        return unifiedResponse(false, ERROR.CREW_SUBMISSION_FORBIDDEN);
      }

      if (submission.status !== 'PENDING') {
        return unifiedResponse(false, ERROR.CREW_SUBMISSION_NOT_PENDING);
      }

      await this.externalSubmissionRepository.deleteById(submissionId);

      // Clean up file from Google Drive
      await this.fileStorageService.delete(submission.externalFileUrl).catch(err => {
        console.error('Failed to delete submission file from storage:', err);
      });

      return unifiedResponse(true, SUCCESS.CREW_SUBMISSION_DELETED);
    } catch {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async scanCertificates(files: Express.Multer.File[]) {
    try {
      const results = await this.certificateService.scanCertificates(files);
      return unifiedResponse(true, 'Scan completed', results);
    } catch {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }
}
