import api from "@/lib/api";
import { User } from "../types/user.types";
import { useQuery } from "@tanstack/react-query";
import { PaginatedResponse } from "@/features/person/_hooks/useGetPersons";

export interface UseGetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useGetUsers(params?: UseGetUsersParams) {
  const { page = 1, limit = 10, search = "" } = params || {};

  return useQuery({
    queryKey: ["users", page, limit, search],
    queryFn: async (): Promise<PaginatedResponse<User>> => {
      const response = await api.get<{ success: boolean; data: PaginatedResponse<User> }>("/users", {
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
        },
      });
      return response.data.data;
    },
  });
}
