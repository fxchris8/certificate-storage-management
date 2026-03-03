import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ReviewSubmissionInput } from '../types/external-submission.types';

export function useApproveSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReviewSubmissionInput }) => {
      const response = await api.post(`/external-submissions/${id}/approve`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['external-submission'] });
      toast.success('Submission approved successfully');
    },
    onError: () => {
      toast.error('Failed to approve submission');
    },
  });
}
