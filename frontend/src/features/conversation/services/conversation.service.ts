import { apiClient } from '@/api/client';
import type {
  ConversationListItem,
  ConversationView,
  EvaluationMessageResult,
  MessageTurnResult,
  StartEvaluationResult,
} from '@/types/conversation';

type ConversationListApiItem = Omit<ConversationListItem, 'favorite'>;

export async function startEvaluation(
  initiativeId: string,
  mode: 'interview' | 'direct' = 'interview',
): Promise<StartEvaluationResult> {
  return apiClient.post<StartEvaluationResult>(
    `/api/initiatives/${initiativeId}/evaluations`,
    { mode },
  );
}

export async function getConversation(id: string): Promise<ConversationView> {
  return apiClient.get<ConversationView>(`/api/conversations/${id}`);
}

export async function sendMessage(
  conversationId: string,
  message: string,
  signal?: AbortSignal,
): Promise<MessageTurnResult> {
  return apiClient.post<MessageTurnResult>(
    `/api/conversations/${conversationId}/messages`,
    { message },
    { signal, retry: 0 },
  );
}

export async function generateEvaluation(
  conversationId: string,
): Promise<EvaluationMessageResult> {
  return apiClient.post<EvaluationMessageResult>(
    `/api/conversations/${conversationId}/generate`,
    {},
    { retry: 0 },
  );
}

export async function listConversations(): Promise<ConversationListItem[]> {
  const items = await apiClient.get<ConversationListApiItem[]>('/api/conversations');
  return items.map((item) => ({
    ...item,
    favorite: false,
  }));
}
