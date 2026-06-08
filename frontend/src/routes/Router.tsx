import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicRoute from "@/components/PublicRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { UserDashboardPage } from "@/features/user/pages/UserDashboardPage";
import { CertificatesPage } from "@/features/dashboard/pages/CertificatesPage";

const Router = [
  {
    path: "/",
    element: <PublicRoute />,
    children: [
      { path: "", element: <Navigate to="/auth/login" replace /> },
      { path: "auth/login", element: <LoginPage /> },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "dashboard",
        element: <DashboardLayout />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: "users", element: <UserDashboardPage /> },
            { path: "certificates/:seamancode", element: <CertificatesPage /> },
        ]
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
];

const baseUrl = import.meta.env.BASE_URL;
const basename = baseUrl === "/" ? undefined : baseUrl.replace(/\/$/, "");
const router = createBrowserRouter(Router, { basename });

export default router;
