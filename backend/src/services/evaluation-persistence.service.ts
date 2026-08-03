import {
  ConversationStatus,
  EvaluationStatus,
  InitiativeStatus,
  Prisma,
} from '@prisma/client';
import { listClassifications } from '../repositories/classification.repository.js';
import { listCriteria } from '../repositories/criteria.repository.js';
import { updateConversation } from '../repositories/conversation.repository.js';
import {
  getEvaluationOrThrow,
  updateEvaluation,
} from '../repositories/evaluation.repository.js';
import { updateInitiative } from '../repositories/domain-initiative.repository.js';
import { listWorkTables } from '../repositories/work-table.repository.js';
import {
  computeWeightedFit,
  type BusinessCase,
  type CriterionScore,
  type EvaluationResultsPayload,
} from '../types/evaluation-domain.types.js';
import { AppError } from '../utils/AppError.js';

export type PersistEvaluationInput = {
  evaluationId: string;
  initiativeId: string;
  criteriaScores: Array<{
    criteriaId: string;
    score: number;
    justification: string;
  }>;
  classificationId: string;
  classificationJustification: string;
  workTableId: string;
  workTableJustification: string;
  priority: 'Alta' | 'Media' | 'Baja';
  priorityJustification: string;
  businessCase: BusinessCase;
  recommendations?: string[];
};

/**
 * Business persistence for completed evaluations.
 * Fit and weight math live here — never in the LLM.
 */
export async function persistEvaluationResult(input: PersistEvaluationInput) {
  const evaluation = await getEvaluationOrThrow(input.evaluationId);

  if (evaluation.status === EvaluationStatus.COMPLETED) {
    throw new AppError('Evaluation already completed and immutable', 409);
  }

  const activeCriteria = (await listCriteria()).filter((item) => item.activo);
  const classifications = await listClassifications();
  const workTables = await listWorkTables();

  const classification = classifications.find(
    (item) => item.id === input.classificationId && item.activo,
  );
  const workTable = workTables.find(
    (item) => item.id === input.workTableId && item.activo,
  );

  if (!classification) {
    throw new AppError('Invalid classificationId', 400);
  }
  if (!workTable) {
    throw new AppError('Invalid workTableId', 400);
  }

  const criteriaScores: CriterionScore[] = input.criteriaScores.map((score) => {
    const criterion = activeCriteria.find((item) => item.id === score.criteriaId);
    if (!criterion) {
      throw new AppError(`Unknown or inactive criteriaId: ${score.criteriaId}`, 400);
    }
    return {
      criteriaId: criterion.id,
      nombre: criterion.nombre,
      peso: criterion.peso,
      score: score.score,
      justification: score.justification,
    };
  });

  if (criteriaScores.length !== activeCriteria.length) {
    throw new AppError('Debes puntuar todos los criterios activos', 400);
  }

  const missing = activeCriteria.filter(
    (item) => !criteriaScores.some((score) => score.criteriaId === item.id),
  );
  if (missing.length > 0) {
    throw new AppError(
      `Faltan scores para: ${missing.map((item) => item.nombre).join(', ')}`,
      400,
    );
  }

  const fit = computeWeightedFit(criteriaScores);
  const businessCase = input.businessCase;

  const results: EvaluationResultsPayload = {
    fit,
    criteriaScores,
    priority: input.priority,
    priorityJustification: input.priorityJustification,
    classificationJustification: input.classificationJustification,
    workTableJustification: input.workTableJustification,
  };

  const weightsSnapshot = Object.fromEntries(
    criteriaScores.map((item) => [item.criteriaId, item.peso]),
  );

  await updateEvaluation(input.evaluationId, {
    status: EvaluationStatus.COMPLETED,
    results: results as unknown as Prisma.InputJsonValue,
    criteriaSnapshot: activeCriteria as unknown as Prisma.InputJsonValue,
    weightsSnapshot: weightsSnapshot as unknown as Prisma.InputJsonValue,
    classificationSnapshot: classification as unknown as Prisma.InputJsonValue,
    workTableSnapshot: workTable as unknown as Prisma.InputJsonValue,
    classification: { connect: { id: classification.id } },
    workTable: { connect: { id: workTable.id } },
    businessCase: JSON.stringify(businessCase),
    recommendations: (input.recommendations ?? [
      businessCase.recomendacionFinal,
    ]) as unknown as Prisma.InputJsonValue,
    priority: input.priority,
    evaluatedAt: new Date(),
    configVersion: evaluation.configVersion ?? new Date().toISOString(),
  });

  if (evaluation.conversation) {
    await updateConversation(evaluation.conversation.id, {
      status: ConversationStatus.COMPLETED,
      completion: 100,
    });
  }

  await updateInitiative(input.initiativeId, {
    status: InitiativeStatus.EVALUATED,
  });

  return {
    saved: true as const,
    evaluationId: input.evaluationId,
    fit,
    priority: input.priority,
    classification,
    workTable,
    criteriaScores,
    businessCase,
    results,
  };
}
