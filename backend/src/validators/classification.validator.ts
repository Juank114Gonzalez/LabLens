import { z } from 'zod';

export const createClassificationSchema = z.object({
  nombre: z.string().trim().min(1).max(255),
  descripcion: z.string().trim().min(1),
  promptContext: z.string().trim().min(1),
  activo: z.boolean().optional(),
});

export const updateClassificationSchema = createClassificationSchema.partial();

export const classificationIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export type CreateClassificationDto = z.infer<typeof createClassificationSchema>;
export type UpdateClassificationDto = z.infer<typeof updateClassificationSchema>;
export type ClassificationIdParamsDto = z.infer<typeof classificationIdParamsSchema>;
