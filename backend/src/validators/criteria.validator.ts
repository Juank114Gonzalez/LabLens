import { z } from 'zod';

export const createCriteriaSchema = z.object({
  nombre: z.string().trim().min(1).max(255),
  descripcion: z.string().trim().min(1),
  promptContext: z.string().trim().min(1),
  // Decimal a propósito: el enunciado declara pesos de 12.5%.
  peso: z.number().min(0).max(100),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
});

export const updateCriteriaSchema = createCriteriaSchema.partial();

export const criteriaIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const reorderCriteriaSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        orden: z.number().int().min(0),
        peso: z.number().min(0).max(100),
        activo: z.boolean(),
      }),
    )
    .min(1),
});

export type CreateCriteriaDto = z.infer<typeof createCriteriaSchema>;
export type UpdateCriteriaDto = z.infer<typeof updateCriteriaSchema>;
export type CriteriaIdParamsDto = z.infer<typeof criteriaIdParamsSchema>;
export type ReorderCriteriaDto = z.infer<typeof reorderCriteriaSchema>;
