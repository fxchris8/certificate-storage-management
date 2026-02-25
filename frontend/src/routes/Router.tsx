import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicRoute from "@/components/PublicRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SsoCallbackPage } from "@/features/auth/pages/SsoCallbackPage";
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
      // SSO callback — must be a public route so unauthenticated users can land here
      { path: "auth/sso/callback", element: <SsoCallbackPage /> },
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

const router = createBrowserRouter(Router);

export default router;
