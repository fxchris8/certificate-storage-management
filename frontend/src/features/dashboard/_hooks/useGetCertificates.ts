import api from "@/lib/api";
import { Certificate } from "../types/certificate.types";
import { useQuery } from "@tanstack/react-query";
import { PaginatedMeta } from "@/features/person/_hooks/useGetPersons";

export interface CertificatePaginatedMeta extends PaginatedMeta {
  hasIjazah: boolean;
  hasEndorse: boolean;
  hasMedicalCheckup: boolean;
}

export interface CertificatePaginatedResponse {
  data: Certificate[];
  meta: CertificatePaginatedMeta;
}

export interface UseGetCertificatesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useGetCertificates(seamanCode: string | undefined, params?: UseGetCertificatesParams) {
  const { page = 1, limit = 10, search = "" } = params || {};

  return useQuery({
    queryKey: ["certificates", seamanCode, page, limit, search],
    queryFn: async (): Promise<CertificatePaginatedResponse> => {
      const response = await api.get<{ success: boolean; data: CertificatePaginatedResponse }>(
        `/certificates/person/${seamanCode}`,
        {
          params: {
            page,
            limit,
            ...(search ? { search } : {}),
          },
        }
      );
      return response.data.data;
    },
    enabled: !!seamanCode,
  });
}
