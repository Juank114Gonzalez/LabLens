import type { ConversationStatus, Prisma } from '@prisma/client';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

export async function findConversationById(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      evaluation: {
        include: {
          initiative: {
            include: {
              companyContacts: true,
              attachments: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
          evaluator: { select: { id: true, name: true, email: true } },
          classification: true,
          workTable: true,
        },
      },
    },
  });
}

export async function getConversationOrThrow(id: string) {
  const conversation = await findConversationById(id);
  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }
  return conversation;
}

export async function updateConversation(
  id: string,
  data: {
    status?: ConversationStatus;
    completion?: number;
    title?: string | null;
  },
) {
  const payload: Prisma.ConversationUpdateInput = {};
  if (data.status !== undefined) payload.status = data.status;
  if (data.completion !== undefined) payload.completion = data.completion;
  if (data.title !== undefined) payload.title = data.title;
  return prisma.conversation.update({ where: { id }, data: payload });
}

export async function listConversationsForEvaluator(options: {
  evaluatorId?: string;
  all?: boolean;
}) {
  return prisma.conversation.findMany({
    where: options.all ? undefined : { evaluation: { evaluatorId: options.evaluatorId } },
    orderBy: { updatedAt: 'desc' },
    include: {
      evaluation: {
        select: {
          id: true,
          status: true,
          readinessStatus: true,
          initiativeId: true,
          initiative: { select: { id: true, nombre: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, createdAt: true },
      },
    },
  });
}
