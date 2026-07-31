import { Prisma, type Conversation, type ConversationStatus } from '@prisma/client';
import { prisma } from '../services/prisma.service.js';
import type { EvaluationResult } from '../types/evaluation.types.js';
import type { InitiativeData } from '../types/initiative-data.types.js';
import { createEmptyInitiativeData } from '../types/initiative-data.types.js';
import { AppError } from '../utils/AppError.js';

export async function createConversation(): Promise<Conversation> {
  return prisma.conversation.create({
    data: {
      initiativeData: createEmptyInitiativeData(),
    },
  });
}

export async function findConversationById(id: string): Promise<Conversation | null> {
  return prisma.conversation.findUnique({ where: { id } });
}

export async function getConversationOrThrow(id: string): Promise<Conversation> {
  const conversation = await findConversationById(id);

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  return conversation;
}

export async function findConversationWithMessages(id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  return conversation;
}

export type ConversationUpdateInput = {
  status?: ConversationStatus;
  completion?: number;
  initiativeData?: InitiativeData;
  evaluation?: EvaluationResult | null;
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

  if (data.initiativeData !== undefined) {
    payload.initiativeData = data.initiativeData;
  }

  if (data.evaluation !== undefined) {
    payload.evaluation =
      data.evaluation === null ? Prisma.DbNull : data.evaluation;
  }

  return prisma.conversation.update({
    where: { id },
    data: payload,
  });
}
