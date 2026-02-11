import api from "@/lib/api";
import { Person } from "../types/person.types";
import { useQuery } from "@tanstack/react-query";

export function useGetPersons() {
  return useQuery({
    queryKey: ["persons"],
    queryFn: async (): Promise<Person[]> => {
      const response = await api.get<{ success: boolean; data: Person[] }>("/persons");
      return response.data.data;
    },
  });
}
