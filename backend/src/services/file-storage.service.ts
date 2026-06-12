import fs from 'fs-extra';
import path from 'path';

const GOOGLE_DRIVE_FILE_PREFIX = 'gdrive://';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

interface FileStorageConfig {
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  googleDriveFolderId: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
}

interface GoogleDriveFileResponse {
  id: string;
  name?: string;
  mimeType?: string;
}

export interface StoredFile {
  buffer: Buffer;
  contentType: string;
  fileName?: string;
}

export class FileStorageService {
  private accessToken?: string;
  private accessTokenExpiresAt = 0;
  private accessTokenRequest?: Promise<string>;

  constructor(private readonly config: FileStorageConfig) {}

  async upload(file: Express.Multer.File, fileName: string): Promise<string> {
    const accessToken = await this.getAccessToken();
    const metadata = JSON.stringify({
      name: fileName,
      parents: [this.config.googleDriveFolderId],
    });

    const sessionResponse = await fetch(
      `${GOOGLE_DRIVE_UPLOAD_URL}?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': String(file.size),
          'X-Upload-Content-Type': file.mimetype,
        },
        body: metadata,
      },
    );

    if (!sessionResponse.ok) {
      throw await this.createGoogleApiError(sessionResponse, 'Failed to start Google Drive upload');
    }

    const uploadUrl = sessionResponse.headers.get('location');
    if (!uploadUrl) {
      throw new Error('Google Drive did not return a resumable upload URL');
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Length': String(file.size),
        'Content-Type': file.mimetype,
      },
      body: new Uint8Array(file.buffer),
    });

    if (!uploadResponse.ok) {
      throw await this.createGoogleApiError(
        uploadResponse,
        'Failed to upload file to Google Drive',
      );
    }

    const uploadedFile = (await uploadResponse.json()) as GoogleDriveFileResponse;
    if (!uploadedFile.id) {
      throw new Error('Google Drive upload completed without a file ID');
    }

    return `${GOOGLE_DRIVE_FILE_PREFIX}${uploadedFile.id}`;
  }

  async read(fileUrl: string): Promise<StoredFile> {
    if (this.isGoogleDriveFile(fileUrl)) {
      return this.readGoogleDriveFile(this.getGoogleDriveFileId(fileUrl));
    }

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`External file request failed with status ${response.status}`);
      }

      return {
        buffer: Buffer.from(await response.arrayBuffer()),
        contentType: response.headers.get('content-type') || 'application/octet-stream',
        fileName: this.getResponseFileName(response),
      };
    }

    const filePath = path.resolve(fileUrl);
    if (!(await fs.pathExists(filePath))) {
      throw new Error('Certificate file not found on server');
    }

    return {
      buffer: await fs.readFile(filePath),
      contentType: this.getContentType(filePath),
      fileName: path.basename(filePath),
    };
  }

  async delete(fileUrl: string): Promise<void> {
    if (this.isGoogleDriveFile(fileUrl)) {
      const accessToken = await this.getAccessToken();
      const response = await fetch(
        `${GOOGLE_DRIVE_FILES_URL}/${encodeURIComponent(this.getGoogleDriveFileId(fileUrl))}?supportsAllDrives=true`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!response.ok && response.status !== 404) {
        throw await this.createGoogleApiError(response, 'Failed to delete Google Drive file');
      }
      return;
    }

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return;
    }

    const filePath = path.resolve(fileUrl);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  }

  private async readGoogleDriveFile(fileId: string): Promise<StoredFile> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `${GOOGLE_DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw await this.createGoogleApiError(response, 'Failed to download Google Drive file');
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      fileName: this.getResponseFileName(response),
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.accessTokenRequest) {
      this.accessTokenRequest = this.refreshAccessToken().finally(() => {
        this.accessTokenRequest = undefined;
      });
    }

    return this.accessTokenRequest;
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.googleClientId,
        client_secret: this.config.googleClientSecret,
        refresh_token: this.config.googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw await this.createGoogleApiError(
        response,
        'Failed to refresh Google OAuth access token',
      );
    }

    const token = (await response.json()) as GoogleTokenResponse;
    if (!token.access_token) {
      throw new Error('Google OAuth token response did not include an access token');
    }

    this.accessToken = token.access_token;
    this.accessTokenExpiresAt =
      Date.now() + Math.max(0, token.expires_in * 1000 - TOKEN_EXPIRY_BUFFER_MS);
    return token.access_token;
  }

  private isGoogleDriveFile(fileUrl: string): boolean {
    return fileUrl.startsWith(GOOGLE_DRIVE_FILE_PREFIX);
  }

  private getGoogleDriveFileId(fileUrl: string): string {
    const fileId = fileUrl.slice(GOOGLE_DRIVE_FILE_PREFIX.length);
    if (!fileId) {
      throw new Error('Invalid Google Drive file reference');
    }
    return fileId;
  }

  private getContentType(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
    };
    return contentTypes[extension] || 'application/octet-stream';
  }

  private getResponseFileName(response: Response): string | undefined {
    const disposition = response.headers.get('content-disposition');
    const match = disposition?.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  private async createGoogleApiError(response: Response, context: string): Promise<Error> {
    let detail = response.statusText || 'Unknown Google API error';

    try {
      const payload = (await response.json()) as {
        error?: string | { message?: string };
        error_description?: string;
      };
      if (typeof payload.error === 'string') {
        detail = payload.error_description || payload.error;
      } else if (payload.error?.message) {
        detail = payload.error.message;
      }
    } catch {
      // Keep the HTTP status text when the response is not JSON.
    }

    return new Error(`${context} (${response.status}): ${detail}`);
  }
}
