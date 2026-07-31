import { getConversation } from '@/features/conversation/services/conversation.service';
import type { EvaluationResult } from '@/types/evaluation';

/**
 * Evaluations are embedded in completed conversations today.
 * TODO(backend): GET /api/evaluations
 * TODO(backend): GET /api/evaluations/:id
 */
export async function getEvaluationByConversation(
  conversationId: string,
): Promise<EvaluationResult | null> {
  const conversation = await getConversation(conversationId);
  return conversation.evaluation;
}
