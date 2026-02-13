import { z } from 'zod';

export const createCertificateSchema = z.object({
  personId: z.string().uuid({ message: 'Person ID must be a valid UUID' }),
  certificateName: z
    .string()
    .min(1, { message: 'Certificate name is required' })
    .max(255, { message: 'Certificate name must not exceed 255 characters' }),
  nomorSertifikat: z
    .string()
    .min(1, { message: 'Nomor sertifikat is required' })
    .max(100, { message: 'Nomor sertifikat must not exceed 100 characters' }),
});

export const updateCertificateSchema = z.object({
  certificateName: z
    .string()
    .min(1, { message: 'Certificate name must not be empty' })
    .max(255, { message: 'Certificate name must not exceed 255 characters' })
    .optional(),
  nomorSertifikat: z
    .string()
    .min(1, { message: 'Nomor sertifikat must not be empty' })
    .max(100, { message: 'Nomor sertifikat must not exceed 100 characters' })
    .optional(),
});
