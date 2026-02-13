import path from 'path';
import fs from 'fs-extra';
import { unifiedResponse } from 'uni-response';

import { SUCCESS, ERROR } from '../../../constants/messages';
import { CertificateRepository } from '../repositories/certificate.repository';
import { CreateCertificateInput, UpdateCertificateInput } from '../types/certificate.types';

export class CertificateService {
  constructor(private readonly certificateRepository: CertificateRepository) {}

  async getCertificatesBySeamanCode(seamanCode: string) {
    const person = await this.certificateRepository.findPersonBySeamanCode(seamanCode);
    if (!person) {
      return unifiedResponse(false, ERROR.PERSON_NOT_FOUND);
    }

    const certificates = await this.certificateRepository.findBySeamanCode(seamanCode);
    return unifiedResponse(true, SUCCESS.CERTIFICATE_FOUND, certificates);
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

  async viewCertificateFile(seamanCode: string, nomorSertifikat: string) {
    const certificate = await this.certificateRepository.findBySeamanCodeAndNomor(seamanCode, nomorSertifikat);
    if (!certificate) {
      return { success: false, message: ERROR.CERTIFICATE_NOT_FOUND };
    }

    const filePath = path.resolve(certificate.fileUrl);
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return { success: false, message: 'Certificate file not found on server' };
    }

    return { success: true, filePath, certificate };
  }

  async downloadCertificateFile(seamanCode: string, nomorSertifikat: string) {
    return this.viewCertificateFile(seamanCode, nomorSertifikat);
  }
}
