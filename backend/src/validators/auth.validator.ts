import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  email: z.string().trim().email('email must be valid').max(255),
  password: z.string().min(6, 'password must be at least 6 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email('email must be valid').max(255),
  password: z.string().min(1, 'password is required').max(128),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
