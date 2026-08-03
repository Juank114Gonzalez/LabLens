import { InitiativeStatus, MessageRole, Role } from '@prisma/client';
import {
  toEvaluationResultView,
  type EvaluationResultView,
} from '../mappers/evaluation.mapper.js';
import { listCriteria } from '../repositories/criteria.repository.js';
import { getInitiativeOrThrow } from '../repositories/domain-initiative.repository.js';
import {
  createEvaluationWithConversation,
  deleteEvaluation,
  getEvaluationOrThrow,
  listEvaluationsForUser,
} from '../repositories/evaluation.repository.js';
import { createMessage } from '../repositories/message.repository.js';
import type { ToolContext } from '../types/tools.types.js';
import { AppError } from '../utils/AppError.js';
import { runInterviewAgent } from './agent.service.js';
import { runEvaluationPipeline } from './evaluation-pipeline.service.js';

export type EvaluationStartMode = 'interview' | 'direct';

const OPENING_PROMPT = `Inicia la entrevista (Modo Entrevista) de esta iniciativa.
Usa getInitiative, getPreviousEvaluations y getEvaluationCriteria si aporta.
Confirma que revisaste el material. No emitas scores ni juicios.
No generes la evaluación. Actualiza updateReadiness con diagnóstico inicial.
Abre como Analista Senior, similar a:
"He revisado la iniciativa. Ahora necesito ampliar algunos aspectos antes de generar una evaluación."
Haz una sola pregunta de profundización.`;

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

async function createEvaluationShell(
  initiativeId: string,
  actorId: string,
  initiativeName: string,
) {
  const criteria = (await listCriteria()).filter((item) => item.activo);
  if (criteria.length === 0) {
    throw new AppError('No hay criterios activos configurados', 409);
  }

  const weightsSnapshot = Object.fromEntries(
    criteria.map((item) => [item.id, item.peso]),
  );

  return createEvaluationWithConversation({
    initiativeId,
    evaluatorId: actorId,
    title: `Evaluación · ${initiativeName || 'Iniciativa'}`,
    criteriaSnapshot: criteria,
    weightsSnapshot,
    configVersion: buildConfigVersion(criteria),
  });
}

function buildTranscript(
  messages: Array<{ role: string; content: string }>,
): string {
  return messages
    .filter((item) => item.role === 'user' || item.role === 'assistant')
    .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
    .join('\n\n');
}

/**
 * Starts a new evaluation shell.
 * - interview: conversational enrichment (no scores)
 * - direct: runs evaluation pipeline immediately on initiative data
 */
export async function startEvaluationForInitiative(
  initiativeId: string,
  actor: { id: string; role: Role },
  mode: EvaluationStartMode = 'interview',
) {
  assertEvaluator(actor.role);

  const initiative = await getInitiativeOrThrow(initiativeId, {
    userId: actor.id,
    isAdmin: true,
  });

  if (initiative.status === InitiativeStatus.ARCHIVED) {
    throw new AppError('No se pueden evaluar iniciativas archivadas', 409);
  }

  const evaluation = await createEvaluationShell(
    initiativeId,
    actor.id,
    initiative.nombre,
  );

  const conversation = evaluation.conversation;
  if (!conversation) {
    throw new AppError('Conversation was not created', 500);
  }

  const context: ToolContext = {
    evaluationId: evaluation.id,
    initiativeId,
    userId: actor.id,
  };

  if (mode === 'direct') {
    await createMessage({
      conversationId: conversation.id,
      role: MessageRole.system,
      content:
        'Evaluación directa sin entrevista. El pipeline usó los datos de la iniciativa al momento de la generación.',
    });

    const pipeline = await runEvaluationPipeline({
      evaluationId: evaluation.id,
      initiativeId,
      transcript: '',
    });

    await createMessage({
      conversationId: conversation.id,
      role: MessageRole.assistant,
      content: pipeline.report,
    });

    const refreshed = await getEvaluationOrThrow(evaluation.id);
    return {
      mode: 'direct' as const,
      evaluationId: refreshed.id,
      conversationId: conversation.id,
      status: refreshed.status,
      readinessStatus: refreshed.readinessStatus,
      readiness: refreshed.readiness,
      openingMessage: pipeline.report,
      evaluation: toEvaluationResultView({
        ...refreshed,
        conversation: { id: conversation.id },
      }),
    };
  }

  const agent = await runInterviewAgent(
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
    mode: 'interview' as const,
    evaluationId: refreshed.id,
    conversationId: refreshed.conversation!.id,
    status: refreshed.status,
    readinessStatus: refreshed.readinessStatus,
    readiness: refreshed.readiness,
    openingMessage: agent.message,
    evaluation: null,
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

export async function deleteEvaluationForAdmin(
  evaluationId: string,
  actor: { id: string; role: Role },
) {
  if (actor.role !== Role.ADMIN) {
    throw new AppError('Forbidden', 403);
  }

  await getEvaluationOrThrow(evaluationId);
  await deleteEvaluation(evaluationId);
  return { ok: true };
}

/**
 * Modo Evaluación: pipeline determinístico. El usuario decide cuándo.
 * No requiere readiness READY; la entrevista solo enriquece el contexto.
 */
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
      evaluation: toEvaluationResultView({
        ...evaluation,
        conversation: { id: conversation.id },
      }),
      reply: 'La evaluación ya está completada y es inmutable.',
    };
  }

  await createMessage({
    conversationId,
    role: MessageRole.user,
    content: 'Generar evaluación',
  });

  const transcript = buildTranscript([
    ...conversation.messages,
    { role: 'user', content: 'Generar evaluación' },
  ]);

  const pipeline = await runEvaluationPipeline({
    evaluationId: evaluation.id,
    initiativeId: evaluation.initiativeId,
    transcript,
  });

  await createMessage({
    conversationId,
    role: MessageRole.assistant,
    content: pipeline.report,
  });

  const refreshed = await getEvaluationOrThrow(evaluation.id);
  return {
    type: 'evaluation' as const,
    reply: pipeline.report,
    evaluation: toEvaluationResultView({
      ...refreshed,
      conversation: { id: conversation.id },
    }),
  };
}
