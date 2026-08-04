import { Role } from '@prisma/client';
import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export const createUserAdminSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  email: z.string().trim().email('email must be valid').max(255),
  password: z.string().min(6, 'password must be at least 6 characters').max(128),
  role: z.nativeEnum(Role).default(Role.EVALUATOR),
});

export const updateUserAdminSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(255).optional(),
  password: z.string().min(6).max(128).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
export type CreateUserAdminDto = z.infer<typeof createUserAdminSchema>;
export type UpdateUserAdminDto = z.infer<typeof updateUserAdminSchema>;
export type UserIdParamsDto = z.infer<typeof userIdParamsSchema>;
