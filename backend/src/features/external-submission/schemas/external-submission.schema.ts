import { z } from 'zod';

export const createExternalSubmissionSchema = z.object({
  externalSubmissionId: z.string().uuid(),
  seamanCode: z.string().min(1),
  seamanName: z.string().min(1),
  certificateName: z.string().min(1),
  nomorSertifikat: z.string().min(1),
  // externalFileUrl removed - file is uploaded via multipart
});

export const reviewSubmissionSchema = z.object({
  reviewNotes: z.string().min(1),
});
