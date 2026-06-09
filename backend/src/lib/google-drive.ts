import fs from 'fs-extra';
import { drive_v3, google } from 'googleapis';
import path from 'path';

import { env } from '../config/env-config';

const driveScope = 'https://www.googleapis.com/auth/drive';

function createDriveClient(): drive_v3.Drive {
  const useOAuth =
    Boolean(env.GOOGLE_CLIENT_ID) ||
    Boolean(env.GOOGLE_CLIENT_SECRET) ||
    Boolean(env.GOOGLE_REFRESH_TOKEN);

  if (useOAuth) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN) {
      throw new Error(
        'Google Drive OAuth credentials are incomplete. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.',
      );
    }

    const auth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);

    auth.setCredentials({
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
    });

    return google.drive({ version: 'v3', auth });
  }

  if (env.GDRIVE_CLIENT_EMAIL && env.GDRIVE_PRIVATE_KEY) {
    const auth = new google.auth.JWT({
      email: env.GDRIVE_CLIENT_EMAIL,
      key: env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: [driveScope],
    });

    return google.drive({ version: 'v3', auth });
  }

  throw new Error(
    'Google Drive credentials are not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.',
  );
}

export async function uploadFileToDrive(
  filePath: string,
  originalName: string,
  mimeType: string,
  folderId?: string,
): Promise<{ id: string; name?: string }> {
  const fileMetadata: Record<string, unknown> = {
    name: originalName,
  };

  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const response = await createDriveClient().files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id,name',
    supportsAllDrives: true,
  });

  const fileId = response.data.id;
  if (!fileId || typeof fileId !== 'string') {
    throw new Error('Failed to upload file to Google Drive');
  }

  const fileName = typeof response.data.name === 'string' ? response.data.name : undefined;
  return { id: fileId, name: fileName };
}

export async function getDriveFileMetadata(fileId: string) {
  const response = await createDriveClient().files.get({
    fileId,
    fields: 'id,name,mimeType',
    supportsAllDrives: true,
  });
  return response.data;
}

export async function downloadFileFromDrive(fileId: string) {
  const response = await createDriveClient().files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    {
      responseType: 'stream',
    },
  );

  return response.data;
}

export async function deleteFileFromDrive(fileId: string) {
  await createDriveClient().files.delete({
    fileId,
    supportsAllDrives: true,
  });
}
