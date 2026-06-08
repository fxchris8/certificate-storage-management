import fs from 'fs-extra';
import path from 'path';
import { unifiedResponse } from 'uni-response';

import { ERROR, SUCCESS } from '../../../constants/messages';
import { deleteFileFromDrive, getDriveFileMetadata } from '../../../lib/google-drive';
import { CertificateRepository } from '../repositories/certificate.repository';
import { CreateCertificateInput, UpdateCertificateInput } from '../types/certificate.types';

type CertificateFile = {
  id: string;
  personId: string;
  certificateName: string;
  nomorSertifikat: string;
  fileUrl: string;
  uploadedAt: Date;
};

type CertificateFileResult =
  | { success: false; message: string }
  | {
      success: true;
      certificate: CertificateFile;
      driveFileId: string;
      driveFileName?: string;
      mimeType?: string;
    }
  | { success: true; certificate: CertificateFile; filePath: string };

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

  private isDriveFile(fileUrl: string): boolean {
    return fileUrl !== '' && !fileUrl.includes(path.sep) && !path.isAbsolute(fileUrl);
  }

  async deleteCertificate(id: string) {
    const existing = await this.certificateRepository.findById(id);
    if (!existing) {
      return unifiedResponse(false, ERROR.CERTIFICATE_NOT_FOUND);
    }

    try {
      if (existing.fileUrl) {
        if (this.isDriveFile(existing.fileUrl)) {
          await deleteFileFromDrive(existing.fileUrl);
        } else {
          const filePath = path.resolve(existing.fileUrl);
          if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
          }
        }
      }

      await this.certificateRepository.delete(id);
      return unifiedResponse(true, SUCCESS.CERTIFICATE_DELETED);
    } catch (error) {
      return unifiedResponse(false, 'Failed to delete certificate');
    }
  }

  async viewCertificateFile(
    seamanCode: string,
    nomorSertifikat: string,
  ): Promise<CertificateFileResult> {
    const certificate = await this.certificateRepository.findBySeamanCodeAndNomor(
      seamanCode,
      nomorSertifikat,
    );
    if (!certificate) {
      return { success: false, message: ERROR.CERTIFICATE_NOT_FOUND };
    }

    if (this.isDriveFile(certificate.fileUrl)) {
      const metadata = await getDriveFileMetadata(certificate.fileUrl);
      return {
        success: true,
        certificate,
        driveFileId: certificate.fileUrl,
        driveFileName: metadata.name ?? undefined,
        mimeType: metadata.mimeType ?? undefined,
      };
    }

    const filePath = path.resolve(certificate.fileUrl);
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return { success: false, message: 'Certificate file not found on server' };
    }

    return { success: true, filePath, certificate };
  }

  async downloadCertificateFile(
    seamanCode: string,
    nomorSertifikat: string,
  ): Promise<CertificateFileResult> {
    const result = await this.viewCertificateFile(seamanCode, nomorSertifikat);
    if (!result.success) {
      return result;
    }

    return result;
  }
}
