import { z } from 'zod';

export const calculateFitArgsSchema = z.object({
  initiativeDescription: z
    .string()
    .min(10)
    .describe('Descripción consolidada de la iniciativa a puntuar'),
});

export type CalculateFitArgs = z.infer<typeof calculateFitArgsSchema>;
