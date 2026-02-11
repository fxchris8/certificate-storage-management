import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface Stats {
  totalSeafarers: number;
  totalCertificates: number;
}

export function useGetStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async (): Promise<Stats> => {
      const response = await api.get<{ success: boolean; data: Stats }>("/persons/stats");
      return response.data.data;
    },
  });
}
