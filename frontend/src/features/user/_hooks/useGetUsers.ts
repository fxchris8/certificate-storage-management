import api from "@/lib/api";
import { User } from "../types/user.types";
import { useQuery } from "@tanstack/react-query";

export function useGetUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await api.get<{ success: boolean; data: User[] }>("/users");
      return response.data.data;
    },
  });
}
