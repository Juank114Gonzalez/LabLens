import { ConversationStatus, InitiativeStatus } from '@prisma/client';
import {
  getConversationOrThrow,
  updateConversation,
} from '../repositories/conversation.repository.js';
import {
  createEvaluation,
  createInitiative,
  setCurrentEvaluation,
  updateInitiative,
} from '../repositories/user-initiative.repository.js';
import { createMessage, listMessagesByConversation } from '../repositories/message.repository.js';
import type { AgentChatData, ChatMessage } from '../types/chat.types.js';
import { createEmptyInitiativeData } from '../types/initiative-data.types.js';
import type { EvaluationResult } from '../types/evaluation.types.js';
import { AppError } from '../utils/AppError.js';
import { runLabLensAgent } from './agent.service.js';

export type ConversationAgentResult = AgentChatData & {
  conversationId: string;
  status: ConversationStatus;
  completion: number;
  /** Frontend compatibility alias */
  reply: string;
  type: 'collecting' | 'evaluation';
  initiativeData: ReturnType<typeof createEmptyInitiativeData>;
  evaluation: EvaluationResult | null;
  missingFields: string[];
};

function toEvaluation(data: AgentChatData): EvaluationResult | null {
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

function deriveTitle(data: AgentChatData, fallback: string | null): string {
  const fromSummary = data.summary?.problema?.trim();
  if (fromSummary) {
    return fromSummary.length > 80 ? `${fromSummary.slice(0, 77)}...` : fromSummary;
  }
  return fallback?.trim() || 'Iniciativa evaluada';
}

async function persistEvaluationEntities(input: {
  userId: string;
  conversationId: string;
  existingInitiativeId: string | null;
  existingTitle: string | null;
  data: AgentChatData;
  evaluation: EvaluationResult;
}): Promise<{ initiativeId: string; title: string }> {
  const title = deriveTitle(input.data, input.existingTitle);
  const fit = input.data.fit!;

  let initiativeId = input.existingInitiativeId;

  if (initiativeId) {
    await updateInitiative(initiativeId, {
      title,
      status: InitiativeStatus.EVALUATED,
    });
  } else {
    const initiative = await createInitiative({
      userId: input.userId,
      title,
      status: InitiativeStatus.EVALUATED,
    });
    initiativeId = initiative.id;
  }

  const created = await createEvaluation({
    initiativeId,
    fit: fit.fit,
    impact: fit.impact,
    alignment: fit.alignment,
    dataAvailability: fit.dataAvailability,
    complexity: fit.complexity,
    summary: input.evaluation.summary,
    recommendations: input.evaluation.recommendations,
  });

  await setCurrentEvaluation(initiativeId, created.id);

  await updateConversation(input.conversationId, {
    status: ConversationStatus.COMPLETED,
    completion: 100,
    title,
    initiativeId,
  });

  return { initiativeId, title };
}

/**
 * Conversation turn orchestrator.
 * No business rules here — only persistence + agent invocation.
 */
export async function processConversationMessage(
  conversationId: string,
  userId: string,
  message: string,
): Promise<ConversationAgentResult> {
  const conversation = await getConversationOrThrow(conversationId, userId);

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
  const initiativeData = createEmptyInitiativeData();

  if (evaluated && evaluation) {
    const persisted = await persistEvaluationEntities({
      userId,
      conversationId,
      existingInitiativeId: conversation.initiativeId,
      existingTitle: conversation.title,
      data,
      evaluation,
    });
    initiativeData.title = persisted.title;
  } else {
    await updateConversation(conversationId, {
      status: ConversationStatus.COLLECTING_INFORMATION,
      completion: conversation.completion,
    });
  }

  await createMessage({
    conversationId,
    role: 'assistant',
    content: data.message,
  });

  return {
    ...data,
    conversationId,
    status: evaluated
      ? ConversationStatus.COMPLETED
      : ConversationStatus.COLLECTING_INFORMATION,
    completion: evaluated ? 100 : conversation.completion,
    reply: data.message,
    type: evaluated ? 'evaluation' : 'collecting',
    initiativeData,
    evaluation,
    missingFields: [],
  };
}
