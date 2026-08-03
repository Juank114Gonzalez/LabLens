import {
  createConversation,
  findConversationWithMessages,
  getConversationOrThrow,
  listConversationsForUser,
} from '../repositories/conversation.repository.js';
import type {
  ConversationListItem,
  ConversationView,
} from '../types/conversation.types.js';
import { createEmptyInitiativeData } from '../types/initiative-data.types.js';
import { projectEvaluation } from '../utils/evaluation-projection.js';

function checklistFromTitle(title: string | null | undefined) {
  const data = createEmptyInitiativeData();
  if (title?.trim()) {
    data.title = title.trim();
  }
  return data;
}

export async function startConversation(userId: string): Promise<ConversationView> {
  const conversation = await createConversation(userId);

  return {
    id: conversation.id,
    userId: conversation.userId,
    initiativeId: conversation.initiativeId,
    title: conversation.title,
    status: conversation.status,
    completion: conversation.completion,
    initiativeData: createEmptyInitiativeData(),
    evaluation: null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export async function getConversationState(
  conversationId: string,
  userId: string,
): Promise<ConversationView> {
  const conversation = await findConversationWithMessages(conversationId, userId);

  return {
    id: conversation.id,
    userId: conversation.userId,
    initiativeId: conversation.initiativeId,
    title: conversation.title,
    status: conversation.status,
    completion: conversation.completion,
    initiativeData: checklistFromTitle(conversation.title),
    evaluation: projectEvaluation(conversation.initiative?.currentEvaluation),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    })),
  };
}

export async function listUserConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  const conversations = await listConversationsForUser(userId);

  return conversations.map((conversation) => ({
    id: conversation.id,
    title: conversation.title?.trim() || 'Nueva iniciativa',
    status: conversation.status,
    completion: conversation.completion,
    preview: conversation.messages[0]?.content ?? 'Conversación recién creada',
    initiativeId: conversation.initiativeId,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  }));
}

export async function ensureConversationExists(conversationId: string, userId: string) {
  return getConversationOrThrow(conversationId, userId);
}
