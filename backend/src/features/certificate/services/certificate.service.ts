import path from 'path';
import fs from 'fs-extra';
// import FormData from 'form-data'; // Use native FormData
import { unifiedResponse } from 'uni-response';

import { env } from '../../../config/env-config';
import { SUCCESS, ERROR } from '../../../constants/messages';
import { CertificateRepository } from '../repositories/certificate.repository';
import { CreateCertificateInput, UpdateCertificateInput, OcrScanResult, BulkCreateItem } from '../types/certificate.types';

export class CertificateService {
  constructor(private readonly certificateRepository: CertificateRepository) {}

  async getCertificatesBySeafarerCode(seafarerCode: string, params?: { page?: number; limit?: number; search?: string }) {
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
      }
    });
  }

  async getCertificateById(id: string) {
    const certificate = await this.certificateRepository.findById(id);
    if (!certificate) {
      return unifiedResponse(false, ERROR.CERTIFICATE_NOT_FOUND);
    }
    return unifiedResponse(true, SUCCESS.CERTIFICATE_FOUND, certificate);
  }

  async createCertificate(data: CreateCertificateInput) {
    const certificate = await this.certificateRepository.create(data);
    return unifiedResponse(true, SUCCESS.CERTIFICATE_CREATED, certificate);
  }

  async updateCertificate(id: string, data: UpdateCertificateInput) {
    const existing = await this.certificateRepository.findById(id);
    if (!existing) {
      return unifiedResponse(false, ERROR.CERTIFICATE_NOT_FOUND);
    }

    try {
      const updated = await this.certificateRepository.update(id, data);
      return unifiedResponse(true, SUCCESS.CERTIFICATE_UPDATED, updated);
    } catch (error) {
      return unifiedResponse(false, 'Failed to update certificate');
    }
  }

  async deleteCertificate(id: string) {
    const existing = await this.certificateRepository.findById(id);
    if (!existing) {
      return unifiedResponse(false, ERROR.CERTIFICATE_NOT_FOUND);
    }

    try {
      // Delete the file from disk if it exists
      if (existing.fileUrl) {
        const filePath = path.resolve(existing.fileUrl);
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
        }
      }

      await this.certificateRepository.delete(id);
      return unifiedResponse(true, SUCCESS.CERTIFICATE_DELETED);
    } catch (error) {
      return unifiedResponse(false, 'Failed to delete certificate');
    }
  }

  async viewCertificateFile(seafarerCode: string, nomorSertifikat: string) {
    const certificate = await this.certificateRepository.findBySeafarerCodeAndNomor(seafarerCode, nomorSertifikat);
    if (!certificate) {
      return { success: false, message: ERROR.CERTIFICATE_NOT_FOUND };
    }

    // Check if fileUrl is an external URL (from SPIL)
    if (certificate.fileUrl.startsWith('http://') || certificate.fileUrl.startsWith('https://')) {
      return { success: true, isExternal: true, externalUrl: certificate.fileUrl, certificate };
    }

    // Local file path
    const filePath = path.resolve(certificate.fileUrl);
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return { success: false, message: 'Certificate file not found on server' };
    }

    return { success: true, isExternal: false, filePath, certificate };
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

        const response = await fetch(ocrUrl, {
          method: 'POST',
          body: formData,
        });

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

        const data = await response.json() as {
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
}
