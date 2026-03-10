import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExternalSubmission } from '../types/external-submission.types';

interface PaginatedResponse {
  submissions: ExternalSubmission[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useGetExternalSubmissions(
  page: number = 1,
  limit: number = 10,
  status?: string,
  search?: string
) {
  return useQuery({
    queryKey: ['external-submissions', page, limit, status, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const response = await api.get(`/external-submissions?${params.toString()}`);
      return response.data.data as PaginatedResponse;
    },
  });
}
