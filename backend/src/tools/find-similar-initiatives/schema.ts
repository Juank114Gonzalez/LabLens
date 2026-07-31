import { z } from 'zod';

export const findSimilarInitiativesArgsSchema = z.object({
  description: z
    .string()
    .min(3)
    .describe('Descripción de la iniciativa a comparar con el histórico'),
  limit: z.number().int().min(1).max(5).optional().default(5),
});

export type FindSimilarInitiativesArgs = z.infer<
  typeof findSimilarInitiativesArgsSchema
>;
