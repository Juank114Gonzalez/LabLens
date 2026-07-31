import { z } from 'zod';

export const searchKnowledgeArgsSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Tema o pregunta a buscar en la knowledge base del Lab'),
});

export type SearchKnowledgeArgs = z.infer<typeof searchKnowledgeArgsSchema>;
