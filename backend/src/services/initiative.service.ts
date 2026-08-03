import {
  getInitiativeWithEvaluationsOrThrow,
  listInitiativesForUser,
} from '../repositories/user-initiative.repository.js';
import { projectEvaluation } from '../utils/evaluation-projection.js';

export async function listInitiatives(userId: string) {
  const initiatives = await listInitiativesForUser(userId);

  return initiatives.map((initiative) => ({
    id: initiative.id,
    title: initiative.title,
    status: initiative.status,
    currentEvaluationId: initiative.currentEvaluationId,
    currentEvaluation: projectEvaluation(initiative.currentEvaluation),
    createdAt: initiative.createdAt,
    updatedAt: initiative.updatedAt,
  }));
}

export async function getInitiative(id: string, userId: string) {
  const initiative = await getInitiativeWithEvaluationsOrThrow(id, userId);

  return {
    id: initiative.id,
    title: initiative.title,
    status: initiative.status,
    currentEvaluationId: initiative.currentEvaluationId,
    currentEvaluation: projectEvaluation(initiative.currentEvaluation),
    evaluations: initiative.evaluations.map((evaluation) =>
      projectEvaluation(evaluation),
    ),
    createdAt: initiative.createdAt,
    updatedAt: initiative.updatedAt,
  };
}
