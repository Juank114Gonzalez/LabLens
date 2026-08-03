import { apiClient } from '@/api/client';
import { getConversation } from '@/features/conversation/services/conversation.service';
import type { EvaluationResult } from '@/types/evaluation';

export async function getEvaluation(id: string): Promise<EvaluationResult> {
  return apiClient.get<EvaluationResult>(`/api/evaluations/${id}`);
}

export async function getEvaluationByConversation(
  conversationId: string,
): Promise<EvaluationResult | null> {
  const conversation = await getConversation(conversationId);
  return conversation.evaluation;
}

export async function listEvaluations() {
  return apiClient.get<
    Array<{
      id: string;
      status: string;
      readinessStatus?: string;
      initiative: { id: string; nombre: string; status: string };
      conversation: { id: string; status: string; updatedAt: string } | null;
      evaluator: { id: string; name: string } | null;
      updatedAt: string;
      createdAt: string;
    }>
  >('/api/evaluations');
}

export async function deleteEvaluation(id: string): Promise<void> {
  await apiClient.delete(`/api/evaluations/${id}`);
}
