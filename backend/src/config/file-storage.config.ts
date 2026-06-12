import { FileStorageService } from '../services/file-storage.service';
import { env } from './env-config';

export const fileStorageService = new FileStorageService({
  googleClientId: env.GOOGLE_CLIENT_ID,
  googleClientSecret: env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: env.GOOGLE_REFRESH_TOKEN,
  googleDriveFolderId: env.GDRIVE_FOLDER_ID,
});
