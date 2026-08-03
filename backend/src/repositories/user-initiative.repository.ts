import {
  InitiativeStatus,
  type Evaluation,
  type Initiative,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

export async function createInitiative(input: {
  userId: string;
  title: string;
  status?: InitiativeStatus;
}): Promise<Initiative> {
  return prisma.initiative.create({
    data: {
      userId: input.userId,
      title: input.title,
      status: input.status ?? InitiativeStatus.DRAFT,
    },
  });
}

export async function findInitiativeByIdForUser(
  id: string,
  userId: string,
): Promise<Initiative | null> {
  return prisma.initiative.findFirst({
    where: { id, userId },
  });
}

export async function getInitiativeWithEvaluationsOrThrow(id: string, userId: string) {
  const initiative = await prisma.initiative.findFirst({
    where: { id, userId },
    include: {
      evaluations: { orderBy: { createdAt: 'desc' } },
      currentEvaluation: true,
    },
  });

  if (!initiative) {
    throw new AppError('Initiative not found', 404);
  }

  return initiative;
}

export async function listInitiativesForUser(userId: string) {
  return prisma.initiative.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      currentEvaluation: true,
    },
  });
}

export async function updateInitiative(
  id: string,
  data: Prisma.InitiativeUpdateInput,
): Promise<Initiative> {
  return prisma.initiative.update({ where: { id }, data });
}

export async function createEvaluation(input: {
  initiativeId: string;
  fit: number;
  impact: number;
  alignment: number;
  dataAvailability: number;
  complexity: number;
  summary: string;
  recommendations: string[];
}): Promise<Evaluation> {
  return prisma.evaluation.create({
    data: {
      initiativeId: input.initiativeId,
      fit: input.fit,
      impact: input.impact,
      alignment: input.alignment,
      dataAvailability: input.dataAvailability,
      complexity: input.complexity,
      summary: input.summary,
      recommendations: input.recommendations,
    },
  });
}

export async function setCurrentEvaluation(
  initiativeId: string,
  evaluationId: string,
): Promise<Initiative> {
  return prisma.initiative.update({
    where: { id: initiativeId },
    data: {
      currentEvaluationId: evaluationId,
      status: InitiativeStatus.EVALUATED,
    },
  });
}
