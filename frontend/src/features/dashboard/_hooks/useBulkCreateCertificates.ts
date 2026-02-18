import api from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface BulkCreateItem {
  personId: string;
  certificateName: string;
  nomorSertifikat: string;
  fileUrl: string;
}

export function useBulkCreateCertificates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: BulkCreateItem[]) => {
      const response = await api.post("/certificates/bulk", { items });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}
