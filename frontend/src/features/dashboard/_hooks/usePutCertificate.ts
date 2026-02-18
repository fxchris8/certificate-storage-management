import api from "@/lib/api";
import { Certificate } from "../types/certificate.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function usePutCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await api.put<{ success: boolean; data: Certificate }>(
        `/certificates/${id}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}
