import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { removeToken } from "@/lib/cookies";

export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = () => {
    removeToken();
    queryClient.clear();
    navigate("/login");
  };

  return { signOut };
}
