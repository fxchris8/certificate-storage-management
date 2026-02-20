import api from "@/lib/api";
import { Person } from "../types/person.types";
import { useQuery } from "@tanstack/react-query";

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface UseGetPersonsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useGetPersons(params?: UseGetPersonsParams) {
  const { page = 1, limit = 10, search = "" } = params || {};

  return useQuery({
    queryKey: ["persons", page, limit, search],
    queryFn: async (): Promise<PaginatedResponse<Person>> => {
      const response = await api.get<{ success: boolean; data: PaginatedResponse<Person> }>("/persons", {
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
