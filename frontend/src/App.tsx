import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { DashboardLayout } from "./layouts/DashboardLayout"
import { DashboardPage } from "./features/dashboard/pages/DashboardPage"
import { CertificatesPage } from "./features/dashboard/pages/CertificatesPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="certificates/:seamancode" element={<CertificatesPage />} />
          <Route path="settings" element={<div className="p-4">Settings Page Placeholder</div>} />
        </Route>
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
