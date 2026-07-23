import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { getCrewToken } from "@/lib/auth";

interface CrewPublicRouteProps {
  children?: React.ReactNode;
}

/**
 * CrewPublicRoute component untuk protect pages crew yang tidak memerlukan authentication (login, register)
 * Jika crew sudah authenticated dan mencoba akses login/register, redirect ke /crew
 */
export const CrewPublicRoute: React.FC<CrewPublicRouteProps> = ({ children }) => {
  const auth = getCrewToken();
  const location = useLocation();

  if (auth && (location.pathname === "/crew/login" || location.pathname === "/crew/register")) {
    return <Navigate to="/crew" replace />;
  }

  // Jika belum authenticated atau bukan halaman auth crew, render children atau Outlet untuk nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default CrewPublicRoute;
