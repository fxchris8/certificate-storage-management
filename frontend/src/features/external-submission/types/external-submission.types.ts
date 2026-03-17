export interface ExternalSubmission {
  id: string;
  externalSubmissionId: string;
  seafarerCode: string;
  seafarerName: string;
  certificateName: string;
  nomorSertifikat: string;
  externalFileUrl: string;
  status: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  personId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSubmissionInput {
  reviewNotes: string;
}
