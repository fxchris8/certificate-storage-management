export interface CreateExternalSubmissionInput {
  externalSubmissionId: string;
  seamanCode: string;
  seamanName: string;
  certificateName: string;
  nomorSertifikat: string;
  externalFileUrl: string;
}

export interface ReviewSubmissionInput {
  reviewNotes: string;
}

export interface ExternalSubmissionResponse {
  id: string;
  externalSubmissionId: string;
  seamanCode: string;
  seamanName: string;
  certificateName: string;
  nomorSertifikat: string;
  externalFileUrl: string;
  status: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  personId?: string;
  createdAt: Date;
  updatedAt: Date;
}
