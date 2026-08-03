import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().min(1).default('gemini-3-flash-preview'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES: z.string().min(1).default('7d'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_FOLDER: z.string().min(1).default('lablens'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment variables: ${details}`);
  }

  return result.data;
}

export const env = parseEnv();
