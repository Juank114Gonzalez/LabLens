import { apiClient } from '@/api/client';
import type {
  ConversationView,
  MessageTurnResult,
} from '@/types/conversation';

/** Connected to the real LabLens backend. */
export async function createConversation(): Promise<ConversationView> {
  return apiClient.post<ConversationView>('/api/conversations', undefined, {
    auth: false,
  });
}

export async function getConversation(id: string): Promise<ConversationView> {
  return apiClient.get<ConversationView>(`/api/conversations/${id}`, {
    auth: false,
  });
}

export async function sendMessage(
  conversationId: string,
  message: string,
  signal?: AbortSignal,
): Promise<MessageTurnResult> {
  return apiClient.post<MessageTurnResult>(
    `/api/conversations/${conversationId}/messages`,
    { message },
    { auth: false, signal, retry: 0 },
  );
}

/**
 * TODO(backend): GET /api/conversations
 * Listing is currently derived from local metadata store after create/open.
 */
export async function listConversations(): Promise<never> {
  throw new Error('TODO(backend): GET /api/conversations is not implemented yet');
}

/**
 * TODO(backend): PATCH /api/conversations/:id  { title }
 */
export async function renameConversation(
  id: string,
  title: string,
): Promise<{ id: string; title: string }> {
  void id;
  void title;
  throw new Error('TODO(backend): PATCH /api/conversations/:id is not implemented yet');
}

/**
 * TODO(backend): DELETE /api/conversations/:id
 */
export async function deleteConversation(id: string): Promise<void> {
  void id;
  throw new Error('TODO(backend): DELETE /api/conversations/:id is not implemented yet');
}

/**
 * TODO(backend): POST /api/conversations/:id/favorite
 */
export async function favoriteConversation(
  id: string,
  favorite: boolean,
): Promise<{ id: string; favorite: boolean }> {
  void id;
  void favorite;
  throw new Error(
    'TODO(backend): favorite endpoint for conversations is not implemented yet',
  );
}
