import { z } from 'zod';

export const initiativeIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export type InitiativeIdParamsDto = z.infer<typeof initiativeIdParamsSchema>;
