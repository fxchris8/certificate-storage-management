import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { User } from "@/features/user/types/user.types";

export function useGetMe() {
  return useQuery({
    queryKey: ["get-me"],
    queryFn: async (): Promise<User> => {
      const response = await api.get<{ success: boolean; data: User }>("/auth/me");
      return response.data.data;
    },
    retry: false,
  });
}
