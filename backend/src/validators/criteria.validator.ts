import { z } from 'zod';

export const createCriteriaSchema = z.object({
  nombre: z.string().trim().min(1).max(255),
  descripcion: z.string().trim().min(1),
  promptContext: z.string().trim().min(1),
  peso: z.number().int().min(0).max(100),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
});

export const updateCriteriaSchema = createCriteriaSchema.partial();

export const criteriaIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export type CreateCriteriaDto = z.infer<typeof createCriteriaSchema>;
export type UpdateCriteriaDto = z.infer<typeof updateCriteriaSchema>;
export type CriteriaIdParamsDto = z.infer<typeof criteriaIdParamsSchema>;
