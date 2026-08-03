import { z } from 'zod';

export const createWorkTableSchema = z.object({
  nombre: z.string().trim().min(1).max(255),
  descripcion: z.string().trim().min(1),
  promptContext: z.string().trim().min(1),
  activo: z.boolean().optional(),
});

export const updateWorkTableSchema = createWorkTableSchema.partial();

export const workTableIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export type CreateWorkTableDto = z.infer<typeof createWorkTableSchema>;
export type UpdateWorkTableDto = z.infer<typeof updateWorkTableSchema>;
export type WorkTableIdParamsDto = z.infer<typeof workTableIdParamsSchema>;
