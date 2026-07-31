import type { Message, MessageRole } from '@prisma/client';
import { prisma } from '../services/prisma.service.js';

export async function createMessage(input: {
  conversationId: string;
  role: MessageRole;
  content: string;
}): Promise<Message> {
  return prisma.message.create({
    data: {
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
    },
  });
}

export async function listMessagesByConversation(
  conversationId: string,
): Promise<Message[]> {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}
