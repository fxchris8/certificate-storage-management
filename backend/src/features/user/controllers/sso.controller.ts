import { NextFunction, Request, Response } from 'express';

import { env } from '@/config/env-config';
import { SsoService } from '../services/sso.service';

export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  /**
   * GET /api/auth/sso/initiate
   * Redirects the browser to the SSO portal authorization page.
   */
  initiate = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!this.ssoService.isEnabled) {
        res.status(503).json({
          success: false,
          message: 'SSO belum dikonfigurasi pada server ini',
        });
        return;
      }

      const { url } = this.ssoService.buildAuthorizeUrl();
      res.redirect(url);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/sso/callback
   * Receives the authorization code from SSO portal, exchanges it for tokens,
   * issues a local JWT, then redirects the browser back to the frontend.
   */
  callback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state, error: ssoError, error_description } = req.query as Record<string, string>;

      // SSO portal may return an error (e.g. user denied / no access)
      if (ssoError) {
        const frontendUrl = env.FRONTEND_URL || 'http://localhost:5175';
        res.redirect(`${frontendUrl}/auth/login?sso_error=${encodeURIComponent(error_description || ssoError)}`);
        return;
      }

      if (!code || !state) {
        res.status(400).json({ success: false, message: 'Parameter code atau state tidak ditemukan' });
        return;
      }

      const result = await this.ssoService.handleCallback(code, state);
      const frontendUrl = env.FRONTEND_URL || 'http://localhost:5175';

      if (!result.success) {
        res.redirect(`${frontendUrl}/auth/login?sso_error=${encodeURIComponent(result.message)}`);
        return;
      }

      // Redirect frontend to the SSO callback page with the token in query string.
      // The frontend page will read it, store in cookie, and navigate to dashboard.
      const token = (result.data as any).token;
      res.redirect(`${frontendUrl}/auth/sso/callback?token=${encodeURIComponent(token)}`);
    } catch (error) {
      next(error);
    }
  };
}
