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
  confidence: number;
  status: string;
  certificate_id?: string;
  confidence_id?: number;
  raw_text?: string;
}

export interface BulkCreateItem {
  personId: string;
  certificateName: string;
  nomorSertifikat: string;
  fileUrl: string;
}
