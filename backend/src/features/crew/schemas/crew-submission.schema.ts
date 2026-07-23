import { z } from 'zod';

export const createCrewSubmissionSchema = z.object({
  certificateName: z.string().min(1, { message: 'Certificate name is required' }),
  nomorSertifikat: z.string().min(1, { message: 'Certificate number is required' }),
});
