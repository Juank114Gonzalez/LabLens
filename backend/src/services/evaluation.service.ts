import { InitiativeStatus, MessageRole, Role } from '@prisma/client';
import {
  toEvaluationResultView,
  type EvaluationResultView,
} from '../mappers/evaluation.mapper.js';
import { listCriteria } from '../repositories/criteria.repository.js';
import { getInitiativeOrThrow } from '../repositories/domain-initiative.repository.js';
import {
  createEvaluationWithConversation,
  getEvaluationOrThrow,
  listEvaluationsForUser,
} from '../repositories/evaluation.repository.js';
import { createMessage } from '../repositories/message.repository.js';
import type { ChatMessage } from '../types/chat.types.js';
import type { ToolContext } from '../types/tools.types.js';
import { AppError } from '../utils/AppError.js';
import { runLabLensAgent } from './agent.service.js';

const OPENING_PROMPT = `Inicia la entrevista de evaluación de esta iniciativa.
Usa getInitiative, getPreviousEvaluations y getEvaluationCriteria (y searchKnowledge si aporta).
Confirma que revisaste el material existente (formulario, empresas, evidencias, historial).
No pidas datos que ya existan. No generes la evaluación todavía.
Actualiza updateReadiness con tu diagnóstico inicial.
Abre con un tono de Analista Senior, similar a:
"He revisado la iniciativa. Ahora necesito ampliar algunos aspectos antes de generar una evaluación."
Haz una sola pregunta de profundización.`;

const GENERATE_PROMPT = `El gestor confirmó que desea generar la evaluación ahora.
Con la información de la conversación y las herramientas:
1) getEvaluationCriteria — puntúa CADA criterio activo (0-100) con justificación.
2) getClassifications — elige UNA y justifica.
3) getWorkTables — elige UNA y justifica.
4) Define prioridad Alta|Media|Baja con justificación.
5) generateBusinessCase con un contexto sintético breve.
6) saveEvaluation con IDs reales.
Luego responde al gestor con un resumen ejecutivo corto del resultado (Fit lo calcula el backend).`;

function assertEvaluator(role: Role) {
  if (role !== Role.EVALUATOR && role !== Role.ADMIN) {
    throw new AppError('Forbidden', 403);
  }
}

function buildConfigVersion(criteria: { id: string; peso: number; updatedAt: Date }[]) {
  const stamp = new Date().toISOString();
  const hash = criteria
    .map((item) => `${item.id}:${item.peso}:${item.updatedAt.toISOString()}`)
    .join('|');
  return `cfg-${stamp}-${Buffer.from(hash).toString('base64url').slice(0, 16)}`;
}

export async function startEvaluationForInitiative(
  initiativeId: string,
  actor: { id: string; role: Role },
) {
  assertEvaluator(actor.role);

  const initiative = await getInitiativeOrThrow(initiativeId, {
    userId: actor.id,
    isAdmin: true,
  });

  if (initiative.status === InitiativeStatus.DRAFT) {
    throw new AppError('La iniciativa debe estar registrada para evaluarse', 409);
  }

  const criteria = (await listCriteria()).filter((item) => item.activo);
  if (criteria.length === 0) {
    throw new AppError('No hay criterios activos configurados', 409);
  }

  const weightsSnapshot = Object.fromEntries(
    criteria.map((item) => [item.id, item.peso]),
  );
  const configVersion = buildConfigVersion(criteria);

  const evaluation = await createEvaluationWithConversation({
    initiativeId,
    evaluatorId: actor.id,
    title: `Evaluación · ${initiative.nombre || 'Iniciativa'}`,
    criteriaSnapshot: criteria,
    weightsSnapshot,
    configVersion,
  });

  const conversation = evaluation.conversation;
  if (!conversation) {
    throw new AppError('Conversation was not created', 500);
  }

  const context: ToolContext = {
    evaluationId: evaluation.id,
    initiativeId,
    userId: actor.id,
  };

  const agent = await runLabLensAgent(
    [{ role: 'user', content: OPENING_PROMPT }],
    context,
  );

  await createMessage({
    conversationId: conversation.id,
    role: MessageRole.assistant,
    content: agent.message,
  });

  const refreshed = await getEvaluationOrThrow(evaluation.id);
  return {
    evaluationId: refreshed.id,
    conversationId: refreshed.conversation!.id,
    status: refreshed.status,
    readinessStatus: refreshed.readinessStatus,
    readiness: refreshed.readiness,
    openingMessage: agent.message,
  };
}

export async function listEvaluationsForActor(actor: { id: string; role: Role }) {
  assertEvaluator(actor.role);
  return listEvaluationsForUser({
    evaluatorId: actor.id,
    all: actor.role === Role.ADMIN,
  });
}

export async function getEvaluationResultForActor(
  evaluationId: string,
  actor: { id: string; role: Role },
): Promise<EvaluationResultView> {
  assertEvaluator(actor.role);
  const evaluation = await getEvaluationOrThrow(evaluationId);

  if (
    actor.role !== Role.ADMIN &&
    evaluation.evaluatorId &&
    evaluation.evaluatorId !== actor.id
  ) {
    throw new AppError('Evaluation not found', 404);
  }

  return toEvaluationResultView(evaluation);
}

export async function generateEvaluationFromConversation(
  conversationId: string,
  actor: { id: string; role: Role },
) {
  assertEvaluator(actor.role);

  const { getConversationOrThrow } = await import(
    '../repositories/conversation.repository.js'
  );
  const conversation = await getConversationOrThrow(conversationId);
  const evaluation = conversation.evaluation;

  if (!evaluation) {
    throw new AppError('Evaluation not found for conversation', 404);
  }

  if (
    actor.role !== Role.ADMIN &&
    evaluation.evaluatorId &&
    evaluation.evaluatorId !== actor.id
  ) {
    throw new AppError('Conversation not found', 404);
  }

  if (evaluation.status === 'COMPLETED') {
    return {
      type: 'evaluation' as const,
      evaluation: toEvaluationResultView(evaluation),
      reply: 'La evaluación ya está completada y es inmutable.',
    };
  }

  if (evaluation.readinessStatus !== 'READY') {
    throw new AppError(
      'La evaluación aún no está lista. Continúa la entrevista hasta que el estado sea Lista para evaluar.',
      409,
    );
  }

  const history: ChatMessage[] = conversation.messages.map((item) => ({
    role: item.role === 'system' ? 'user' : item.role,
    content: item.content,
  }));
  history.push({ role: 'user', content: GENERATE_PROMPT });

  const context: ToolContext = {
    evaluationId: evaluation.id,
    initiativeId: evaluation.initiativeId,
    userId: actor.id,
  };

  const agent = await runLabLensAgent(history, context);

  await createMessage({
    conversationId,
    role: MessageRole.user,
    content: 'Generar evaluación',
  });
  await createMessage({
    conversationId,
    role: MessageRole.assistant,
    content: agent.message,
  });

  if (!agent.artifacts.evaluationSaved) {
    throw new AppError(
      'El agente no persistió la evaluación. Intenta de nuevo.',
      502,
    );
  }

  const refreshed = await getEvaluationOrThrow(evaluation.id);
  return {
    type: 'evaluation' as const,
    reply: agent.message,
    evaluation: toEvaluationResultView(refreshed),
  };
}
