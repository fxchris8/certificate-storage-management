import { z } from 'zod';

export const crewLoginSchema = z.object({
  seafarercode: z.string().min(1, { message: 'Seafarer code is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});
