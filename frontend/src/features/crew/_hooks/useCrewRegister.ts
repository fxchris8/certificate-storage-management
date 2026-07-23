import { crewApi } from "@/lib/api";
import { setCrewToken } from "@/lib/cookies";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { CrewRegisterFormData, CrewRegisterResponse } from "../types/crew.types";

export function useCrewRegister() {
  const navigate = useNavigate();

  return useMutation<CrewRegisterResponse, Error, CrewRegisterFormData>({
    mutationKey: ["crew-register"],
    mutationFn: async (data) => {
      const response = await crewApi.post<CrewRegisterResponse>("/crew/auth/register", data);
      return response.data;
    },
    onSuccess: (response, variables) => {
      if (response.success && response.data?.token) {
        setCrewToken(response.data.token);
        localStorage.setItem(
          "crew",
          JSON.stringify({ name: variables.name, seafarercode: variables.seafarercode })
        );
        navigate("/crew");
      }
    },
  });
}
export default useCrewRegister;
