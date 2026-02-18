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

export interface OcrScanResult {
  originalName: string;
  filePath: string;
  trainingName: string;
  confidence: number;
  status: string;
}

export interface BulkCreateItem {
  personId: string;
  certificateName: string;
  nomorSertifikat: string;
  fileUrl: string;
}
