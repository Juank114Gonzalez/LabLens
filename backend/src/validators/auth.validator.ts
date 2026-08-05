import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('email must be valid').max(255),
  password: z.string().min(1, 'password is required').max(128),
});

export const microsoftLoginSchema = z.object({
  accessToken: z.string().min(1, 'accessToken is required'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type MicrosoftLoginDto = z.infer<typeof microsoftLoginSchema>;

