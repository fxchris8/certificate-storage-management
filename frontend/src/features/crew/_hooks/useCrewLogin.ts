import { crewApi } from "@/lib/api";
import { setCrewToken } from "@/lib/cookies";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { CrewLoginFormData, CrewLoginResponse } from "../types/crew.types";

export function useCrewLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<CrewLoginResponse, Error, CrewLoginFormData>({
    mutationKey: ["crew-login"],
    mutationFn: async (data) => {
      const response = await crewApi.post<CrewLoginResponse>("/crew/auth/login", data);
      return response.data;
    },
    onSuccess: (response) => {
      if (response.success && response.data?.token) {
        setCrewToken(response.data.token);
        if (response.data.person) {
          localStorage.setItem("crew", JSON.stringify(response.data.person));
        }
        queryClient.invalidateQueries({ queryKey: ["crew-profile"] });
        navigate("/crew");
      }
    },
  });
}
export default useCrewLogin;
