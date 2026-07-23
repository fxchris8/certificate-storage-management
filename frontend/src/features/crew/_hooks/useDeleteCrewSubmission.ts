import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crewApi } from "@/lib/api";
import { toast } from "sonner";

export function useDeleteCrewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await crewApi.delete(`/crew/submissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-submissions"] });
      toast.success("Submission berhasil dihapus.");
    },
    onError: () => {
      toast.error("Gagal menghapus submission. Hanya submission berstatus PENDING yang dapat dihapus.");
    },
  });
}

export default useDeleteCrewSubmission;
