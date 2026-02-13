import api from "@/lib/api";
import { Certificate } from "../types/certificate.types";
import { useQuery } from "@tanstack/react-query";

export function useGetCertificates(seamanCode: string | undefined) {
  return useQuery({
    queryKey: ["certificates", seamanCode],
    queryFn: async (): Promise<Certificate[]> => {
      const response = await api.get<{ success: boolean; data: Certificate[] }>(
        `/certificates/person/${seamanCode}`
      );
      return response.data.data;
    },
    enabled: !!seamanCode,
  });
}
