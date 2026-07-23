import { useQuery } from "@tanstack/react-query";
import { crewApi } from "@/lib/api";
import type { CrewSubmissionsPaginatedData } from "../types/crew.types";

interface UseCrewSubmissionsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useCrewSubmissions(params: UseCrewSubmissionsParams = {}) {
  const { page = 1, limit = 10, search } = params;

  return useQuery<CrewSubmissionsPaginatedData>({
    queryKey: ["crew-submissions", page, limit, search],
    queryFn: async () => {
      const response = await crewApi.get<{
        success: boolean;
        data: CrewSubmissionsPaginatedData;
      }>("/crew/submissions", {
        params: { page, limit, search: search || undefined },
      });
      // Backend wraps payload: { success, message, data: { submissions, pagination } }
      return response.data.data;
    },
  });
}

export default useCrewSubmissions;
