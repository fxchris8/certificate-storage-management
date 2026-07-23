import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useResetCrewPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ personId, newPassword }: { personId: string; newPassword: string }) => {
      const response = await api.post(`/crew/admin/reset-password/${personId}`, {
        newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Crew password reset successfully");
      queryClient.invalidateQueries({ queryKey: ["persons"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reset crew password");
    },
  });
}
