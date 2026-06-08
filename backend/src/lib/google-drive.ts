import fs from 'fs-extra';
import { google } from 'googleapis';
import path from 'path';

import { env } from '../config/env-config';

if (!env.GDRIVE_CLIENT_EMAIL || !env.GDRIVE_PRIVATE_KEY) {
  throw new Error(
    'Google Drive credentials are not configured. Set GDRIVE_CLIENT_EMAIL and GDRIVE_PRIVATE_KEY.',
  );
}

const gdriveClientEmail = env.GDRIVE_CLIENT_EMAIL;
const gdrivePrivateKey = env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n');

const auth = new google.auth.JWT({
  email: gdriveClientEmail,
  key: gdrivePrivateKey,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

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

  const response = await drive.files.create({
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
  const response = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType',
    supportsAllDrives: true,
  });
  return response.data;
}

export async function downloadFileFromDrive(fileId: string) {
  const response = await drive.files.get(
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
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });
}
