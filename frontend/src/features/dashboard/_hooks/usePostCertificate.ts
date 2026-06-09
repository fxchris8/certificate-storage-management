import api from "@/lib/api";
import { Certificate } from "../types/certificate.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function usePostCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post<{ success: boolean; data: Certificate }>(
        "/certificates",
        formData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}
