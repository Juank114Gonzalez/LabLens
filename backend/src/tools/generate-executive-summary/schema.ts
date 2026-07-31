import { z } from 'zod';

export const generateExecutiveSummaryArgsSchema = z.object({
  initiativeContext: z
    .string()
    .min(20)
    .describe('Contexto consolidado de la iniciativa y hallazgos relevantes'),
  fitJson: z
    .string()
    .optional()
    .describe('JSON string del Fit calculado (si ya se obtuvo)'),
  similarInitiativesJson: z
    .string()
    .optional()
    .describe('JSON string de iniciativas similares (si ya se obtuvieron)'),
});

export type GenerateExecutiveSummaryArgs = z.infer<
  typeof generateExecutiveSummaryArgsSchema
>;
