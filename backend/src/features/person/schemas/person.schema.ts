import { z } from 'zod';

export const createPersonSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must not exceed 255 characters' }),
  seamancode: z
    .string()
    .min(1, { message: 'Seaman code is required' })
    .max(50, { message: 'Seaman code must not exceed 50 characters' }),
});

export const updatePersonSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name must not be empty' })
    .max(255, { message: 'Name must not exceed 255 characters' })
    .optional(),
  seamancode: z
    .string()
    .min(1, { message: 'Seaman code must not be empty' })
    .max(50, { message: 'Seaman code must not exceed 50 characters' })
    .optional(),
});
