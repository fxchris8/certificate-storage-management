import { z } from 'zod';

export const crewRegisterSchema = z.object({
  seafarercode: z.string().min(1, { message: 'Seafarer code is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(100, { message: 'Password must not exceed 100 characters' }),
});
