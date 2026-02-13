export interface Certificate {
  id: string;
  personId: string;
  certificateName: string;
  nomorSertifikat: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface CreateCertificateInput {
  personId: string;
  certificateName: string;
  nomorSertifikat: string;
  file: File;
}

export interface UpdateCertificateInput {
  certificateName?: string;
  nomorSertifikat?: string;
}
