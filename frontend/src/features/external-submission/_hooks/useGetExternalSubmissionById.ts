import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExternalSubmission } from '../types/external-submission.types';

export function useGetExternalSubmissionById(id: string) {
  return useQuery({
    queryKey: ['external-submission', id],
    queryFn: async () => {
      const response = await api.get(`/external-submissions/${id}`);
      return response.data.data as ExternalSubmission;
    },
    enabled: !!id,
  });
}
