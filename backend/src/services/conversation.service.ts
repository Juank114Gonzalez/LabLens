import {
  createConversation,
  findConversationWithMessages,
  getConversationOrThrow,
} from '../repositories/conversation.repository.js';
import type { ConversationView } from '../types/conversation.types.js';
import type { EvaluationResult } from '../types/evaluation.types.js';
import { parseInitiativeData } from '../utils/initiative-data.js';

export async function startConversation(): Promise<ConversationView> {
  const conversation = await createConversation();

  return {
    id: conversation.id,
    status: conversation.status,
    completion: conversation.completion,
    initiativeData: parseInitiativeData(conversation.initiativeData),
    evaluation: null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export async function getConversationState(
  conversationId: string,
): Promise<ConversationView> {
  const conversation = await findConversationWithMessages(conversationId);

  return {
    id: conversation.id,
    status: conversation.status,
    completion: conversation.completion,
    initiativeData: parseInitiativeData(conversation.initiativeData),
    evaluation: (conversation.evaluation as EvaluationResult | null) ?? null,
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

export async function ensureConversationExists(conversationId: string) {
  return getConversationOrThrow(conversationId);
}
