import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('email must be valid').max(255),
  password: z.string().min(1, 'password is required').max(128),
});

export type LoginDto = z.infer<typeof loginSchema>;
