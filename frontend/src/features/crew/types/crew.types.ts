import { z } from "zod";

export const crewLoginSchema = z.object({
  seafarercode: z.string().min(1, { message: "Seafarer Code is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export type CrewLoginFormData = z.infer<typeof crewLoginSchema>;

export const crewRegisterSchema = z.object({
  seafarercode: z.string().min(1, { message: "Seafarer Code is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export type CrewRegisterFormData = z.infer<typeof crewRegisterSchema>;

export interface CrewUser {
  id: string;
  name: string;
  seafarercode: string;
}

export interface CrewLoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    person: CrewUser;
  };
}

export interface CrewRegisterResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    personId: string;
  };
}

// Crew Submission types
export interface CrewSubmission {
  id: string;
  externalSubmissionId: string;
  certificateName: string;      // backend field name
  nomorSertifikat: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  seafarerCode: string;
  seafarerName: string;
  externalFileUrl: string | null;
  personId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrewSubmissionsPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

// Shape of `response.data.data` from GET /api/crew/submissions
export interface CrewSubmissionsPaginatedData {
  submissions: CrewSubmission[];
  pagination: CrewSubmissionsPagination;
}

export interface CrewSubmissionCreateResponse {
  success: boolean;
  message: string;
  data?: CrewSubmission;
}
