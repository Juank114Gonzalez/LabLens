import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

/**
 * dotenv turns `KEY=` into an empty string, which a plain `.optional()` would
 * reject. Treat blank as "not configured" so a commented-out block in .env
 * behaves the same as a missing key.
 */
const optionalText = () =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(1).optional(),
  );

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  ANTHROPIC_MODEL: z.string().min(1).default('claude-haiku-4-5'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Accepts a comma-separated list so staging and production can share a build.
  FRONTEND_ORIGIN: z.string().min(1).default('http://localhost:3000'),
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
  // SMTP is optional: without it the triage still runs and the routing is recorded,
  // only the outbound notification to the work table is skipped.
  SMTP_HOST: optionalText(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optionalText(),
  SMTP_PASS: optionalText(),
  SMTP_FROM: z.string().min(1).default('Lente de Innovación <no-reply@lablens.local>'),
  PUBLIC_SUBMISSION_RATE_LIMIT: z.coerce.number().int().positive().default(10),
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

/** Origins listed explicitly in FRONTEND_ORIGIN. */
export const allowedOrigins = env.FRONTEND_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const LOOPBACK_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * In development Next.js walks to the next free port when 3000 is taken, which
 * silently breaks CORS and surfaces in the browser as "failed to fetch". Any
 * loopback origin is accepted while developing; production stays on the
 * explicit list.
 */
export function isOriginAllowed(origin: string): boolean {
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  return env.NODE_ENV !== 'production' && LOOPBACK_ORIGIN.test(origin);
}
