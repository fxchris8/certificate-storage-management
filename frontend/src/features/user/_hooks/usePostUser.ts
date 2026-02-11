import api from "@/lib/api";
import { CreateUserInput, User } from "../types/user.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function usePostUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await api.post<User>("/users/create", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
