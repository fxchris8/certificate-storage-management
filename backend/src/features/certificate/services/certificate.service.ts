import path from 'path';
// import FormData from 'form-data'; // Use native FormData
import { unifiedResponse } from 'uni-response';

import { env } from '../../../config/env-config';
import { ERROR, SUCCESS } from '../../../constants/messages';
import { FileStorageService } from '../../../services/file-storage.service';
import { CertificateRepository } from '../repositories/certificate.repository';
import {
  BulkCreateItem,
  CreateCertificateInput,
  OcrScanResult,
  UpdateCertificateInput,
} from '../types/certificate.types';

const OCR_REQUEST_TIMEOUT_MS = 2 * 60 * 1000;

export class CertificateService {
  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async getCertificatesBySeafarerCode(
    seafarerCode: string,
    params?: { page?: number; limit?: number; search?: string },
  ) {
    const person = await this.certificateRepository.findPersonBySeafarerCode(seafarerCode);
    if (!person) {
      return unifiedResponse(false, ERROR.PERSON_NOT_FOUND);
    }

    const { page = 1, limit = 10, search } = params || {};
    const skip = (page - 1) * limit;

    const [{ data, total }, mandatoryFlags] = await Promise.all([
      this.certificateRepository.findBySeafarerCode(seafarerCode, { skip, take: limit, search }),
      this.certificateRepository.checkMandatoryDocs(seafarerCode),
    ]);

    return unifiedResponse(true, SUCCESS.CERTIFICATE_FOUND, {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        ...mandatoryFlags,
      },
    });
  }

  async getCertificateById(id: string) {
    const certificate = await this.certificateRepository.findById(id);
    if (!certificate) {
      return unifiedResponse(false, ERROR.CERTIFICATE_NOT_FOUND);
    }
    return unifiedResponse(true, SUCCESS.CERTIFICATE_FOUND, certificate);
  }

  async createCertificate(data: CreateCertificateInput, file: Express.Multer.File) {
    const fileUrl = await this.fileStorageService.upload(
      file,
      this.createFileName(data.certificateName, data.nomorSertifikat, file.originalname),
    );

    try {
      const certificate = await this.certificateRepository.create({ ...data, fileUrl });
      return unifiedResponse(true, SUCCESS.CERTIFICATE_CREATED, certificate);
    } catch (error) {
      await this.fileStorageService.delete(fileUrl).catch(cleanupError => {
        console.error('Failed to roll back Google Drive upload:', cleanupError);
      });
      throw error;
    }
  }

  async updateCertificate(id: string, data: UpdateCertificateInput, file?: Express.Multer.File) {
    const existing = await this.certificateRepository.findById(id);
    if (!existing) {
      return unifiedResponse(false, ERROR.CERTIFICATE_NOT_FOUND);
    }

    let uploadedFileUrl: string | undefined;
    try {
      if (file) {
        uploadedFileUrl = await this.fileStorageService.upload(
          file,
          this.createFileName(
            data.certificateName || existing.certificateName,
            data.nomorSertifikat || existing.nomorSertifikat,
            file.originalname,
          ),
        );
      }

      const updated = await this.certificateRepository.update(id, {
        ...data,
        ...(uploadedFileUrl && { fileUrl: uploadedFileUrl }),
      });

      if (uploadedFileUrl && existing.fileUrl) {
        await this.fileStorageService.delete(existing.fileUrl).catch(cleanupError => {
          console.error('Failed to delete replaced certificate file:', cleanupError);
        });
      }

      return unifiedResponse(true, SUCCESS.CERTIFICATE_UPDATED, updated);
    } catch (error) {
      if (uploadedFileUrl) {
        await this.fileStorageService.delete(uploadedFileUrl).catch(cleanupError => {
          console.error('Failed to roll back replacement upload:', cleanupError);
        });
      }
      return unifiedResponse(false, 'Failed to update certificate');
    }
  }

  async deleteCertificate(id: string) {
    const existing = await this.certificateRepository.findById(id);
    if (!existing) {
      return unifiedResponse(false, ERROR.CERTIFICATE_NOT_FOUND);
    }

    try {
      await this.certificateRepository.delete(id);
      await this.fileStorageService.delete(existing.fileUrl).catch(cleanupError => {
        console.error('Failed to delete certificate file:', cleanupError);
      });
      return unifiedResponse(true, SUCCESS.CERTIFICATE_DELETED);
    } catch (error) {
      return unifiedResponse(false, 'Failed to delete certificate');
    }
  }

  async viewCertificateFile(seafarerCode: string, nomorSertifikat: string) {
    const certificate = await this.certificateRepository.findBySeafarerCodeAndNomor(
      seafarerCode,
      nomorSertifikat,
    );
    if (!certificate) {
      return { success: false, message: ERROR.CERTIFICATE_NOT_FOUND };
    }

    try {
      const file = await this.fileStorageService.read(certificate.fileUrl);
      return { success: true, file, certificate };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Certificate file could not be read',
      };
    }
  }

  async downloadCertificateFile(seafarerCode: string, nomorSertifikat: string) {
    return this.viewCertificateFile(seafarerCode, nomorSertifikat);
  }

  async scanCertificates(files: Express.Multer.File[]): Promise<OcrScanResult[]> {
    const ocrUrl = `${env.OCR_SERVICE_URL}/ocr/extract`;
    const results: OcrScanResult[] = [];

    for (const file of files) {
      try {
        const fileBuffer = file.buffer;
        const blob = new Blob([fileBuffer as unknown as BlobPart], { type: file.mimetype });
        const formData = new FormData();
        formData.append('image', blob, file.originalname);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), OCR_REQUEST_TIMEOUT_MS);
        let response: globalThis.Response;

        try {
          response = await fetch(ocrUrl, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OCR Service Error (${response.status}):`, errorText);
          results.push({
            originalName: file.originalname,
            filePath: '',
            trainingName: '',
            confidence: 0,
            status: 'error',
          });
          continue;
        }

        const data = (await response.json()) as {
          success: boolean;
          data?: {
            training_name: string;
            confidence: number;
            status: string;
            certificate_id: string;
            confidence_id: number;
            raw_text: string;
          };
          error?: string;
        };

        if (data.success && data.data) {
          results.push({
            originalName: file.originalname,
            filePath: '', // File is not saved to disk yet
            trainingName: data.data.training_name,
            confidence: data.data.confidence,
            status: data.data.status,
            certificate_id: data.data.certificate_id,
            confidence_id: data.data.confidence_id,
            raw_text: data.data.raw_text,
          });
        } else {
          results.push({
            originalName: file.originalname,
            filePath: '',
            trainingName: '',
            confidence: 0,
            status: 'failed',
          });
        }
      } catch (error) {
        console.error(`OCR scan failed for ${file.originalname}:`, error);
        results.push({
          originalName: file.originalname,
          filePath: '',
          trainingName: '',
          confidence: 0,
          status: 'error',
        });
      }
    }

    return results;
  }

  async bulkCreateCertificates(items: BulkCreateItem[]) {
    const created = [];
    for (const item of items) {
      const certificate = await this.certificateRepository.create(item);
      created.push(certificate);
    }
    return unifiedResponse(true, SUCCESS.CERTIFICATE_CREATED, created);
  }

  private createFileName(
    certificateName: string,
    nomorSertifikat: string,
    originalName: string,
  ): string {
    const extension = path.extname(originalName).toLowerCase();
    const baseName = `${certificateName}-${nomorSertifikat}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);

    return `${baseName || 'certificate'}${extension}`;
  }
}
