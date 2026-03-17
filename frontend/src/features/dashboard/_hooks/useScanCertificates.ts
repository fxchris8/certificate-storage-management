import api from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

interface ScanResult {
  originalName: string;
  filePath: string;
  trainingName: string;
  confidence: number;
  status: string;
  certificate_id?: string;
  confidence_id?: number;
  raw_text?: string;
}

const SCAN_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;

export function useScanCertificates() {
  return useMutation({
    mutationFn: async (formData: FormData): Promise<ScanResult[]> => {
      const response = await api.post<{ success: boolean; data: ScanResult[] }>(
        "/certificates/scan",
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
