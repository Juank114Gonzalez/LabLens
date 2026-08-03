import { apiClient } from '@/api/client';
import type {
  ConversationListItem,
  ConversationView,
  MessageTurnResult,
} from '@/types/conversation';

type ConversationListApiItem = Omit<ConversationListItem, 'favorite'>;

export async function createConversation(): Promise<ConversationView> {
  return apiClient.post<ConversationView>('/api/conversations');
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

export async function listConversations(): Promise<ConversationListItem[]> {
  const items = await apiClient.get<ConversationListApiItem[]>('/api/conversations');
  return items.map((item) => ({
    ...item,
    favorite: false,
  }));
}
