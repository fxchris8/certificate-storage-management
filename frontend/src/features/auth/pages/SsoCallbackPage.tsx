import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "@/lib/cookies";

/**
 * SsoCallbackPage
 *
 * The backend SSO callback redirects the browser here after a successful
 * SSO login:  /auth/sso/callback?token=<jwt>
 *
 * This page:
 *  1. Reads the token from the URL query string.
 *  2. Stores it in the cookie (same as normal login).
 *  3. Navigates to /dashboard.
 *
 * On error it shows a message and offers a link back to /auth/login.
 */
export function SsoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handled = useRef(false);

  const token = searchParams.get("token");
  const ssoError = searchParams.get("sso_error");

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    if (token) {
      setToken(token);
      navigate("/dashboard", { replace: true });
    }
    // If there's no token and no error, do nothing — the component will render
    // the error state below.
  }, [token, navigate]);

  // While token was found and we're about to redirect, show a loading state.
  if (token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-50">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-sm text-muted-foreground">Menyiapkan sesi Anda…</p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-50">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-800">Login SSO Gagal</h1>
        <p className="text-sm text-gray-500">
          {ssoError
            ? decodeURIComponent(ssoError)
            : "Tidak ada token yang diterima. Silakan coba lagi."}
        </p>
        <a
          href="/auth/login"
          className="inline-block mt-2 text-sm text-indigo-600 hover:underline"
        >
          ← Kembali ke halaman login
        </a>
      </div>
    </div>
  );
}
