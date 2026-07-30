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
import { ExternalSubmissionsSeafarerPage } from "@/features/external-submission/pages/ExternalSubmissionsSeafarerPage";
import { ExternalSubmissionDetailPage } from "@/features/external-submission/pages/ExternalSubmissionDetailPage";

// Crew feature imports
import CrewPublicRoute from "@/components/CrewPublicRoute";
import CrewProtectedRoute from "@/components/CrewProtectedRoute";
import { CrewLoginPage } from "@/features/crew/pages/CrewLoginPage";
import { CrewRegisterPage } from "@/features/crew/pages/CrewRegisterPage";
import { CrewLayout } from "@/layouts/CrewLayout";
import { CrewSubmissionsPage } from "@/features/crew/pages/CrewSubmissionsPage";

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
            { path: "external-submissions/seafarer/:seafarercode", element: <ExternalSubmissionsSeafarerPage /> },
            { path: "external-submissions/:id", element: <ExternalSubmissionDetailPage /> },
        ]
      },
    ],
  },
  {
    path: "/crew",
    element: <CrewPublicRoute />,
    children: [
      { path: "login", element: <CrewLoginPage /> },
      { path: "register", element: <CrewRegisterPage /> },
    ],
  },
  {
    path: "/crew",
    element: <CrewProtectedRoute />,
    children: [
      {
        element: <CrewLayout />,
        children: [
          { index: true, element: <CrewSubmissionsPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
];

let basename = import.meta.env.VITE_BASE_PATH || "/";
if (basename !== "/" && basename.endsWith("/")) {
  basename = basename.slice(0, -1);
}

const router = createBrowserRouter(Router, {
  basename,
});

export default router;
