import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface GroupedSeafarer {
  seafarerCode: string;
  seafarerName: string;
  pendingSubmissions: number;
  latestActivity: string;
}

interface GroupedPaginatedResponse {
  submissions: GroupedSeafarer[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useGetExternalSubmissionsGrouped(
  page: number = 1,
  limit: number = 10,
  search?: string
) {
  return useQuery({
    queryKey: ['external-submissions-grouped', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (search) params.set('search', search);
      
      const response = await api.get(`/external-submissions/grouped?${params.toString()}`);
      return response.data.data as GroupedPaginatedResponse;
    },
  });
}
