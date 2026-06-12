import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FileStorageService } from '../file-storage.service';

const config = {
  googleClientId: 'client-id',
  googleClientSecret: 'client-secret',
  googleRefreshToken: 'refresh-token',
  googleDriveFolderId: 'folder-id',
};

const createFile = (): Express.Multer.File =>
  ({
    buffer: Buffer.from('certificate-content'),
    encoding: '7bit',
    fieldname: 'file',
    mimetype: 'application/pdf',
    originalname: 'certificate.pdf',
    size: 19,
  }) as Express.Multer.File;

describe('FileStorageService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uploads a file to the configured Google Drive folder', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'access-token', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 200,
          headers: { Location: 'https://upload.example/session' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'drive-file-id' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const service = new FileStorageService(config);
    const fileUrl = await service.upload(createFile(), 'CERT-001.pdf');

    expect(fileUrl).toBe('gdrive://drive-file-id');
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const sessionRequest = fetchMock.mock.calls[1];
    expect(sessionRequest[0]).toContain('uploadType=resumable');
    expect(JSON.parse(String(sessionRequest[1]?.body))).toEqual({
      name: 'CERT-001.pdf',
      parents: ['folder-id'],
    });
  });

  it('reads and deletes a Drive file while reusing the access token', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'access-token', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(Buffer.from('stored-file'), {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const service = new FileStorageService(config);
    const file = await service.read('gdrive://drive-file-id');
    await service.delete('gdrive://drive-file-id');

    expect(file.buffer.toString()).toBe('stored-file');
    expect(file.contentType).toBe('application/pdf');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('alt=media');
    expect(fetchMock.mock.calls[2][1]?.method).toBe('DELETE');
  });

  it('surfaces the Google OAuth error without exposing credentials', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Token has been expired or revoked.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const service = new FileStorageService(config);

    await expect(service.read('gdrive://drive-file-id')).rejects.toThrow(
      'Failed to refresh Google OAuth access token (400): Token has been expired or revoked.',
    );
  });
});
