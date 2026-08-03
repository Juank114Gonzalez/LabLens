import { type Conversation, type ConversationStatus, type Prisma } from '@prisma/client';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

export async function createConversation(userId: string): Promise<Conversation> {
  return prisma.conversation.create({
    data: { userId },
  });
}

export async function findConversationByIdForUser(
  id: string,
  userId: string,
): Promise<Conversation | null> {
  return prisma.conversation.findFirst({ where: { id, userId } });
}

export async function getConversationOrThrow(
  id: string,
  userId: string,
): Promise<Conversation> {
  const conversation = await findConversationByIdForUser(id, userId);

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  return conversation;
}

export async function findConversationWithMessages(id: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      initiative: {
        include: {
          currentEvaluation: true,
        },
      },
    },
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  return conversation;
}

export async function listConversationsForUser(userId: string) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          content: true,
          createdAt: true,
        },
      },
    },
  });
}

export type ConversationUpdateInput = {
  status?: ConversationStatus;
  completion?: number;
  title?: string | null;
  initiativeId?: string | null;
};

export async function updateConversation(
  id: string,
  data: ConversationUpdateInput,
): Promise<Conversation> {
  const payload: Prisma.ConversationUpdateInput = {};

  if (data.status !== undefined) {
    payload.status = data.status;
  }

  if (data.completion !== undefined) {
    payload.completion = data.completion;
  }

  if (data.title !== undefined) {
    payload.title = data.title;
  }

  if (data.initiativeId !== undefined) {
    payload.initiative =
      data.initiativeId === null
        ? { disconnect: true }
        : { connect: { id: data.initiativeId } };
  }

  return prisma.conversation.update({
    where: { id },
    data: payload,
  });
}
