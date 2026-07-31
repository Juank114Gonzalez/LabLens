import { z } from 'zod';

export const conversationIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const sendMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'message must be at least 1 character')
    .max(4000, 'message must be at most 4000 characters'),
});

export type ConversationIdParamsDto = z.infer<typeof conversationIdParamsSchema>;
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
