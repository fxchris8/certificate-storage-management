import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExternalSubmission } from '../types/external-submission.types';

export function useGetExternalSubmissions(status?: string) {
  return useQuery({
    queryKey: ['external-submissions', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/external-submissions${params}`);
      return response.data.data as ExternalSubmission[];
    },
  });
}
