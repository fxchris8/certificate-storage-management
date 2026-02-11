import api from "@/lib/api";
import { UpdateUserInput, User } from "../types/user.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function usePutUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await api.put<User>(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
