import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicRoute from "@/components/PublicRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SsoCallbackPage } from "@/features/auth/pages/SsoCallbackPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { UserDashboardPage } from "@/features/user/pages/UserDashboardPage";
import { CertificatesPage } from "@/features/dashboard/pages/CertificatesPage";
import { ExternalSubmissionsPage } from "@/features/external-submission/pages/ExternalSubmissionsPage";
import { ExternalSubmissionDetailPage } from "@/features/external-submission/pages/ExternalSubmissionDetailPage";

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
            { path: "certificates/:seafarercode", element: <CertificatesPage /> },
            { path: "external-submissions", element: <ExternalSubmissionsPage /> },
            { path: "external-submissions/:id", element: <ExternalSubmissionDetailPage /> },
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
