import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { getToken } from "@/lib/cookies";
import { User } from "@/features/user/types/user.types";

export function useGetMe() {
  return useQuery({
    queryKey: ["get-me"],
    queryFn: async (): Promise<User> => {
      const response = await api.get<{ success: boolean; data: User }>("/auth/me");
      return response.data.data;
    },
    enabled: !!getToken(),
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 menit — tidak refetch terus tiap render/refresh
  });
}
