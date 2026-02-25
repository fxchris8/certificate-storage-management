import axios from 'axios';
import crypto from 'crypto';
import { unifiedResponse } from 'uni-response';

import { env } from '@/config/env-config';
import { generateToken } from '@/utils/generate-token.util';
import { UserRepository } from '../repositories/user.repository';

interface SsoUserInfo {
  id: string;
  username: string;
  name?: string;
  role?: string;
}

export class SsoService {
  constructor(private readonly userRepository: UserRepository) {}

  /** Whether SSO is configured via environment variables. */
  get isEnabled(): boolean {
    return !!(
      env.SSO_FRONTEND_URL &&
      env.SSO_BASE_URL &&
      env.SSO_CLIENT_ID &&
      env.SSO_CLIENT_SECRET &&
      env.SSO_CALLBACK_URL
    );
  }

  /**
   * Generate a stateless CSRF state token.
   * Format: <timestamp>.<hmac>
   * No in-memory storage needed — survives hot-reloads and restarts.
   */
  private generateState(): string {
    const timestamp = Date.now().toString();
    const hmac = crypto
      .createHmac('sha256', env.JWT_SECRET as string)
      .update(timestamp)
      .digest('hex');
    return `${timestamp}.${hmac}`;
  }

  /**
   * Validate state: verify HMAC signature and ensure it is not older than 10 minutes.
   */
  private validateStateToken(state: string): boolean {
    const parts = state.split('.');
    if (parts.length !== 2) return false;
    const [timestamp, receivedHmac] = parts;

    const expectedHmac = crypto
      .createHmac('sha256', env.JWT_SECRET as string)
      .update(timestamp)
      .digest('hex');

    const hmacValid = crypto.timingSafeEqual(
      Buffer.from(receivedHmac, 'hex'),
      Buffer.from(expectedHmac, 'hex'),
    );
    if (!hmacValid) return false;

    const age = Date.now() - parseInt(timestamp, 10);
    return age < 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Build the SSO authorization URL using a stateless HMAC-signed state.
   */
  buildAuthorizeUrl(): { url: string; state: string } {
    const state = this.generateState();

    const params = new URLSearchParams({
      client_id: env.SSO_CLIENT_ID!,
      redirect_uri: env.SSO_CALLBACK_URL!,
      response_type: 'code',
      state,
    });

    // Redirect ke SSO Frontend agar user yang belum login
    // bisa melihat halaman login SSO Portal terlebih dahulu.
    return {
      url: `${env.SSO_FRONTEND_URL}/login?${params.toString()}`,
      state,
    };
  }

  /**
   * Validate state using HMAC — no in-memory lookup needed.
   */
  validateState(state: string): boolean {
    return this.validateStateToken(state);
  }

  /**
   * Exchange authorization code for SSO access_token + refresh_token.
   */
  async exchangeCode(code: string): Promise<{ access_token: string; refresh_token: string }> {
    let response;
    try {
      response = await axios.post(`${env.SSO_BASE_URL}/api/v1/oauth/token`, {
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.SSO_CALLBACK_URL!,
        client_id: env.SSO_CLIENT_ID!,
        client_secret: env.SSO_CLIENT_SECRET!,
      });
    } catch (err: any) {
      const detail = err?.response?.data ?? err?.message;
      console.error('[SSO] exchangeCode FAILED:', JSON.stringify(detail, null, 2));
      throw new Error(`SSO token exchange gagal: ${JSON.stringify(detail)}`);
    }
    const payload = response.data?.data ?? response.data;
    if (!payload?.access_token) {
      throw new Error(`access_token tidak ditemukan. Response: ${JSON.stringify(response.data)}`);
    }
    return { access_token: payload.access_token, refresh_token: payload.refresh_token };
  }

  /**
   * Get user info from SSO Portal via GET /api/v1/oauth/userinfo.
   * Returns { id, name, username, role }.
   * Throws on 401 (invalid/expired token) or 403 (inactive account).
   */
  async getSsoUserInfo(accessToken: string): Promise<SsoUserInfo> {
    let res;
    try {
      res = await axios.get(`${env.SSO_BASE_URL}/api/v1/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (e: any) {
      const status: number = e?.response?.status;
      const message: string = e?.response?.data?.message ?? e?.message;

      if (status === 401) {
        throw new Error(`SSO token tidak valid atau sudah kadaluarsa: ${message}`);
      }
      if (status === 403) {
        throw new Error(`Akun SSO tidak aktif: ${message}`);
      }

      throw new Error(`SSO userinfo gagal (${status ?? 'no response'}): ${message}`);
    }

    const user = res.data?.data ?? res.data;
    if (!user?.id || !user?.username) {
      throw new Error(`SSO userinfo: respons tidak lengkap — ${JSON.stringify(res.data)}`);
    }

    return user as SsoUserInfo;
  }

  /**
   * Find existing local user linked to this SSO ID, or link/create one.
   * Priority:
   *  1. Find by ssoId
   *  2. Find by username → link ssoId
   *  3. Create new user (no password, SSO-only)
   */
  async findOrCreateLocalUser(ssoUser: SsoUserInfo): Promise<{ id: string; username: string }> {
    // 1. Find by ssoId
    let user = await this.userRepository.findBySsoId(ssoUser.id);
    if (user) return user;

    // 2. Find by username → link ssoId to existing account
    const existing = await this.userRepository.findUserByUsername(ssoUser.username);
    if (existing) {
      await this.userRepository.updateUser(existing.id, { ssoId: ssoUser.id });
      return { id: existing.id, username: existing.username };
    }

    // 3. Create brand-new SSO-only user (no passwordHash)
    const created = await this.userRepository.createSsoUser({
      username: ssoUser.username,
      ssoId: ssoUser.id,
    });
    return { id: created.id, username: created.username };
  }

  /**
   * Full SSO callback flow.
   * Returns { token, user } on success or unifiedResponse with success: false on error.
   */
  async handleCallback(code: string, state: string) {
    if (!this.validateState(state)) {
      return unifiedResponse(false, 'State parameter tidak valid atau kadaluarsa');
    }

    // Exchange code → SSO tokens
    const { access_token } = await this.exchangeCode(code);

    // Get user info from SSO portal
    const ssoUser = await this.getSsoUserInfo(access_token);

    // Find or create local user
    const localUser = await this.findOrCreateLocalUser(ssoUser);

    // Issue our own JWT for the certificate app
    const token = generateToken(localUser.id, 'user');

    return unifiedResponse(true, 'Login SSO berhasil', {
      token,
      user: { id: localUser.id, username: localUser.username },
    });
  }
}
