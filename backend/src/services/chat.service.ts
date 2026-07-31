import { ConversationStatus } from '@prisma/client';
import {
  getConversationOrThrow,
  updateConversation,
} from '../repositories/conversation.repository.js';
import { createMessage, listMessagesByConversation } from '../repositories/message.repository.js';
import type { AgentChatData, ChatMessage } from '../types/chat.types.js';
import type { EvaluationResult } from '../types/evaluation.types.js';
import { parseInitiativeData } from '../utils/initiative-data.js';
import { AppError } from '../utils/AppError.js';
import { runLabLensAgent } from './agent.service.js';

export type ConversationAgentResult = AgentChatData & {
  conversationId: string;
  status: ConversationStatus;
  completion: number;
  /** Frontend compatibility alias */
  reply: string;
  type: 'collecting' | 'evaluation';
  initiativeData: ReturnType<typeof parseInitiativeData>;
  evaluation: EvaluationResult | null;
};

function toEvaluation(
  data: AgentChatData,
): EvaluationResult | null {
  if (!data.fit || !data.summary) {
    return null;
  }

  return {
    summary: [
      data.summary.problema,
      data.summary.solucionPropuesta,
      data.summary.siguientePasoRecomendado,
    ].join(' '),
    technicalSheet: [
      `Problema: ${data.summary.problema}`,
      `Solución: ${data.summary.solucionPropuesta}`,
      `Beneficios: ${data.summary.beneficios.join('; ')}`,
      `Riesgos: ${data.summary.riesgos.join('; ')}`,
      `Siguiente paso: ${data.summary.siguientePasoRecomendado}`,
    ].join('\n'),
    strengths: data.summary.beneficios,
    weaknesses: data.summary.riesgos,
    recommendations: [data.summary.siguientePasoRecomendado, ...data.fit.observations],
    fit: data.fit.fit,
    scores: {
      fit: data.fit.fit,
      impact: data.fit.impact,
      data: data.fit.dataAvailability,
      complexity: data.fit.complexity,
      alignment: data.fit.alignment,
    },
    similarInitiatives: data.similarInitiatives,
  };
}

/**
 * Conversation turn orchestrator.
 * No business rules here — only persistence + agent invocation.
 */
export async function processConversationMessage(
  conversationId: string,
  message: string,
): Promise<ConversationAgentResult> {
  const conversation = await getConversationOrThrow(conversationId);

  if (conversation.status === ConversationStatus.COMPLETED) {
    throw new AppError('This conversation is already completed', 409);
  }

  await createMessage({
    conversationId,
    role: 'user',
    content: message,
  });

  const storedMessages = await listMessagesByConversation(conversationId);
  const history: ChatMessage[] = storedMessages.map((item) => ({
    role: item.role === 'system' ? 'system' : item.role,
    content: item.content,
  }));

  const agentResult = await runLabLensAgent(history);
  const data: AgentChatData = {
    message: agentResult.message,
    fit: agentResult.artifacts.fit,
    similarInitiatives: agentResult.artifacts.similarInitiatives,
    summary: agentResult.artifacts.summary,
  };

  const evaluated = Boolean(data.fit && data.summary);
  const evaluation = toEvaluation(data);
  const completion = evaluated ? 100 : conversation.completion;
  const status = evaluated
    ? ConversationStatus.COMPLETED
    : ConversationStatus.COLLECTING_INFORMATION;

  await updateConversation(conversationId, {
    status,
    completion,
    evaluation,
  });

  await createMessage({
    conversationId,
    role: 'assistant',
    content: data.message,
  });

  return {
    ...data,
    conversationId,
    status,
    completion,
    reply: data.message,
    type: evaluated ? 'evaluation' : 'collecting',
    initiativeData: parseInitiativeData(conversation.initiativeData),
    evaluation,
  };
}
