import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().url(),
  SHADOW_DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  WHITE_LIST_URLS: z
    .string()
    .transform(value => value.split(',').map(url => url.trim()))
    .refine(urls => urls.every(url => z.string().url().safeParse(url).success), {
      message: 'Each value in WHITE_LIST_URLS must be a valid URL',
    }),
  OCR_SERVICE_URL: z.string().url().default('http://ocr:8000'),
  // SSO Integration (optional — SSO features disabled if not set)
  SSO_BASE_URL: z.string().url().optional(),      // Backend SSO (token exchange, /me)
  SSO_FRONTEND_URL: z.string().url().optional(),  // Frontend SSO (authorize redirect + login page)
  SSO_CLIENT_ID: z.string().optional(),
  SSO_CLIENT_SECRET: z.string().optional(),
  SSO_CALLBACK_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5175'),
  EXTERNAL_API_KEY: z.string().min(32, 'EXTERNAL_API_KEY must be at least 32 characters').optional(),
  SPIL_CALLBACK_URL: z.string().url().optional(),
  SPIL_CALLBACK_API_KEY: z.string().min(32, 'SPIL_CALLBACK_API_KEY must be at least 32 characters').optional(),
});

export type EnvVars = z.infer<typeof envSchema>;
