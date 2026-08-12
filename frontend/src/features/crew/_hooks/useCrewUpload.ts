import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crewApi } from "@/lib/api";
import type { CrewSubmissionCreateResponse } from "../types/crew.types";

const SCAN_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;

interface ScanResult {
  originalName: string;
  filePath: string;
  trainingName: string;
  status: string;
  certificate_id?: string;
  raw_text?: string;
}

export function useCrewScanCertificates() {
  return useMutation({
    mutationFn: async (formData: FormData): Promise<ScanResult[]> => {
      const response = await crewApi.post<{ success: boolean; data: ScanResult[] }>(
        "/crew/submissions/scan",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: SCAN_REQUEST_TIMEOUT_MS,
        }
      );
      return response.data.data;
    },
  });
}

export function useCreateCrewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData): Promise<CrewSubmissionCreateResponse> => {
      const response = await crewApi.post<CrewSubmissionCreateResponse>(
        "/crew/submissions",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["crew-submissions"]});
    }
  });
}

export default useCrewScanCertificates;
