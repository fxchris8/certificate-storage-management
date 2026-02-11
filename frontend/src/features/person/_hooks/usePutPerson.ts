import api from "@/lib/api";
import { UpdatePersonInput, Person } from "../types/person.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function usePutPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePersonInput }) => {
      const response = await api.put<{ success: boolean; data: Person }>(`/persons/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
    },
  });
}
