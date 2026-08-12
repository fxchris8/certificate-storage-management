export interface CreateCertificateInput {
  personId: string;
  certificateName: string;
  nomorSertifikat: string;
}

export interface UpdateCertificateInput {
  certificateName?: string;
  nomorSertifikat?: string;
  fileUrl?: string;
}

export interface OcrScanResult {
  originalName: string;
  filePath: string;
  trainingName: string;
  status: string;
  certificate_id?: string;
  raw_text?: string;
}

export interface BulkCreateItem {
  personId: string;
  certificateName: string;
  nomorSertifikat: string;
  fileUrl: string;
}
