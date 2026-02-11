import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { getToken } from "@/lib/auth";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * ProtectedRoute component untuk protect pages yang membutuhkan authentication
 * Jika user tidak authenticated, redirect ke /auth/login
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const auth = getToken();
  const location = useLocation();

  if (auth && location.pathname === "/auth/login") {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika tidak authenticated, redirect ke login
  if (!auth) {
    return <Navigate to="/auth/login" replace />;
  }

  // Jika authenticated, render children atau Outlet untuk nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
