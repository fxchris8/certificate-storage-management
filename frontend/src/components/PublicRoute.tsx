import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { getToken } from "@/lib/auth";

interface PublicRouteProps {
  children?: React.ReactNode;
}

/**
 * PublicRoute component untuk protect pages yang membutuhkan authentication
 * Jika user sudah authenticated dan mencoba akses login, redirect ke /home
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const auth = getToken();
  const location = useLocation();

  if (auth && location.pathname === "/auth/login") {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika belum authenticated atau bukan halaman login, render children atau Outlet untuk nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default PublicRoute;
