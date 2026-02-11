import api from "@/lib/api";
import { CreatePersonInput, Person } from "../types/person.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function usePostPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePersonInput) => {
      const response = await api.post<{ success: boolean; data: Person }>("/persons", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
    },
  });
}
