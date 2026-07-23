import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { getCrewToken } from "@/lib/auth";

interface CrewProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * CrewProtectedRoute component untuk protect pages crew yang membutuhkan authentication
 * Jika crew tidak authenticated, redirect ke /crew/login
 */
export const CrewProtectedRoute: React.FC<CrewProtectedRouteProps> = ({ children }) => {
  const auth = getCrewToken();
  const location = useLocation();

  if (auth && location.pathname === "/crew/login") {
    return <Navigate to="/crew" replace />;
  }

  // Jika tidak authenticated, redirect ke login crew
  if (!auth) {
    return <Navigate to="/crew/login" replace />;
  }

  // Jika authenticated, render children atau Outlet untuk nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default CrewProtectedRoute;
