import { EvaluationStatus, MessageRole, Role } from '@prisma/client';
import { toEvaluationResultView } from '../mappers/evaluation.mapper.js';
import {
  getConversationOrThrow,
  listConversationsForEvaluator,
} from '../repositories/conversation.repository.js';
import { getEvaluationOrThrow } from '../repositories/evaluation.repository.js';
import { createMessage } from '../repositories/message.repository.js';
import type { EvaluationReadiness } from '../types/evaluation-domain.types.js';
import type { ChatMessage } from '../types/chat.types.js';
import type { ToolContext } from '../types/tools.types.js';
import { AppError } from '../utils/AppError.js';
import { runLabLensAgent } from './agent.service.js';

function assertEvaluator(role: Role) {
  if (role !== Role.EVALUATOR && role !== Role.ADMIN) {
    throw new AppError('Forbidden', 403);
  }
}

function readinessLabelEs(status: string) {
  if (status === 'READY') return 'Lista para evaluar';
  if (status === 'IN_PROGRESS') return 'En progreso';
  return 'Información insuficiente';
}

export function mapConversationView(conversation: Awaited<
  ReturnType<typeof getConversationOrThrow>
>) {
  const evaluation = conversation.evaluation;
  const readiness =
    evaluation?.readiness && typeof evaluation.readiness === 'object'
      ? (evaluation.readiness as EvaluationReadiness)
      : null;

  const startedAt = conversation.createdAt.getTime();
  const elapsedMs = Date.now() - startedAt;

  return {
    id: conversation.id,
    evaluationId: evaluation?.id ?? null,
    initiativeId: evaluation?.initiativeId ?? null,
    title: conversation.title,
    status: conversation.status,
    completion: conversation.completion,
    readinessStatus: evaluation?.readinessStatus ?? 'INSUFFICIENT',
    readinessLabel: readinessLabelEs(evaluation?.readinessStatus ?? 'INSUFFICIENT'),
    readiness,
    initiative: evaluation?.initiative
      ? {
          id: evaluation.initiative.id,
          nombre: evaluation.initiative.nombre,
          status: evaluation.initiative.status,
          companyContacts: evaluation.initiative.companyContacts,
          attachments: evaluation.initiative.attachments,
        }
      : null,
    evaluation:
      evaluation?.status === EvaluationStatus.COMPLETED
        ? toEvaluationResultView({
            ...evaluation,
            conversation: { id: conversation.id },
          })
        : null,
    messageCount: conversation.messages.length,
    elapsedMs,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: conversation.messages.map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content,
      createdAt: item.createdAt,
    })),
  };
}

export async function listConversationsForActor(actor: {
  id: string;
  role: Role;
}) {
  assertEvaluator(actor.role);
  const items = await listConversationsForEvaluator({
    evaluatorId: actor.id,
    all: actor.role === Role.ADMIN,
  });
  return items.map((item) => ({
    id: item.id,
    evaluationId: item.evaluation.id,
    initiativeId: item.evaluation.initiativeId,
    title: item.title ?? item.evaluation.initiative.nombre ?? 'Evaluación',
    status: item.status,
    completion: item.completion,
    readinessStatus: item.evaluation.readinessStatus,
    preview: item.messages[0]?.content?.slice(0, 140) ?? '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function getConversationForActor(
  conversationId: string,
  actor: { id: string; role: Role },
) {
  assertEvaluator(actor.role);
  const conversation = await getConversationOrThrow(conversationId);
  const evaluation = conversation.evaluation;

  if (!evaluation) {
    throw new AppError('Conversation not found', 404);
  }

  if (
    actor.role !== Role.ADMIN &&
    evaluation.evaluatorId &&
    evaluation.evaluatorId !== actor.id
  ) {
    throw new AppError('Conversation not found', 404);
  }

  return mapConversationView(conversation);
}

export async function sendConversationMessage(
  conversationId: string,
  message: string,
  actor: { id: string; role: Role },
) {
  assertEvaluator(actor.role);
  const conversation = await getConversationOrThrow(conversationId);
  const evaluation = conversation.evaluation;

  if (!evaluation) {
    throw new AppError('Conversation not found', 404);
  }

  if (
    actor.role !== Role.ADMIN &&
    evaluation.evaluatorId &&
    evaluation.evaluatorId !== actor.id
  ) {
    throw new AppError('Conversation not found', 404);
  }

  if (evaluation.status === EvaluationStatus.COMPLETED) {
    throw new AppError('La evaluación ya está cerrada', 409);
  }

  await createMessage({
    conversationId,
    role: MessageRole.user,
    content: message,
  });

  const history: ChatMessage[] = [
    ...conversation.messages.map((item) => ({
      role: (item.role === 'system' ? 'user' : item.role) as ChatMessage['role'],
      content: item.content,
    })),
    { role: 'user', content: message },
  ];

  const context: ToolContext = {
    evaluationId: evaluation.id,
    initiativeId: evaluation.initiativeId,
    userId: actor.id,
  };

  const agent = await runLabLensAgent(history, context);

  await createMessage({
    conversationId,
    role: MessageRole.assistant,
    content: agent.message,
  });

  const refreshed = await getConversationOrThrow(conversationId);
  const view = mapConversationView(refreshed);

  return {
    type:
      view.readinessStatus === 'READY'
        ? ('ready' as const)
        : ('collecting' as const),
    conversationId,
    status: view.status,
    readinessStatus: view.readinessStatus,
    readinessLabel: view.readinessLabel,
    readiness: view.readiness,
    reply: agent.message,
    canGenerate: view.readinessStatus === 'READY',
  };
}

export async function getEvaluationByConversationId(
  conversationId: string,
  actor: { id: string; role: Role },
) {
  const conversation = await getConversationForActor(conversationId, actor);
  if (!conversation.evaluationId) {
    throw new AppError('Evaluation not found', 404);
  }
  return getEvaluationOrThrow(conversation.evaluationId).then(toEvaluationResultView);
}
