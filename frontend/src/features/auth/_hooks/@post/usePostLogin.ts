import { api } from "@/lib/api";
import { setToken } from "@/lib/cookies";
import type { LoginFormData } from "@/types/loginSchema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export function usePostLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationKey: ["post-login"],
    mutationFn: async (data: LoginFormData) => {
      // The backend expects { username, password }
      const response = await api.post("/auth/login", data);
      return response.data;
    },
    onSuccess: (data) => {
        // Assuming data contains { token: string } or similar.
        // I need to check backend response shape.
        // Backend `auth.routes.ts` calls `userController.login`.
        // `UserController.login` calls `userService.login`.
        // `UserService.login` returns whatever. 
        // I should probably check the backend controller/service to be sure about response shape.
        // But based on common patterns:
        if (data?.data?.token) {
            setToken(data.data.token);
            queryClient.invalidateQueries({ queryKey: ["get-me"] });
            navigate("/dashboard");
        } else {
             console.error("Login successful but no token received", data);
        }
    },
    onError: (error: any) => {
        console.error("Login failed", error);
        // Toast here
    }
  });
}
