export interface CreateCertificateInput {
  personId: string;
  certificateName: string;
  nomorSertifikat: string;
  fileUrl: string;
}

export interface UpdateCertificateInput {
  certificateName?: string;
  nomorSertifikat?: string;
  fileUrl?: string;
}
