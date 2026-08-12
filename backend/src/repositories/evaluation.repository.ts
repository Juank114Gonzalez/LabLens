import {
  EvaluationStatus,
  InitiativeStatus,
  ReadinessStatus,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

const evaluationInclude = {
  conversation: {
    include: {
      messages: { orderBy: { createdAt: 'asc' as const } },
    },
  },
  initiative: {
    include: {
      companyContacts: true,
      attachments: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  evaluator: { select: { id: true, name: true, email: true } },
  classification: true,
  workTable: true,
  // Solo el número y la fecha: el snapshot completo pesa y ya viaja en
  // `criteriaSnapshot` de la propia evaluación.
  criteriaVersion: { select: { numero: true, createdAt: true } },
} satisfies Prisma.EvaluationInclude;

export async function createEvaluationWithConversation(input: {
  initiativeId: string;
  evaluatorId: string;
  title: string;
  criteriaSnapshot: unknown;
  weightsSnapshot: unknown;
  configVersion: string;
  criteriaVersionId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const evaluation = await tx.evaluation.create({
      data: {
        initiativeId: input.initiativeId,
        evaluatorId: input.evaluatorId,
        status: EvaluationStatus.IN_PROGRESS,
        readinessStatus: ReadinessStatus.INSUFFICIENT,
        criteriaSnapshot: input.criteriaSnapshot as Prisma.InputJsonValue,
        weightsSnapshot: input.weightsSnapshot as Prisma.InputJsonValue,
        configVersion: input.configVersion,
        criteriaVersionId: input.criteriaVersionId,
        conversation: {
          create: {
            title: input.title,
            status: 'COLLECTING_INFORMATION',
          },
        },
      },
      include: evaluationInclude,
    });

    await tx.initiative.update({
      where: { id: input.initiativeId },
      data: { status: InitiativeStatus.UNDER_REVIEW },
    });

    return evaluation;
  });
}

export async function findEvaluationById(id: string) {
  return prisma.evaluation.findUnique({
    where: { id },
    include: evaluationInclude,
  });
}

export async function findEvaluationByConversationId(conversationId: string) {
  return prisma.evaluation.findFirst({
    where: { conversation: { id: conversationId } },
    include: evaluationInclude,
  });
}

export async function getEvaluationOrThrow(id: string) {
  const evaluation = await findEvaluationById(id);
  if (!evaluation) {
    throw new AppError('Evaluation not found', 404);
  }
  return evaluation;
}

export async function updateEvaluation(
  id: string,
  data: Prisma.EvaluationUpdateInput,
) {
  return prisma.evaluation.update({
    where: { id },
    data,
    include: evaluationInclude,
  });
}

export async function deleteEvaluation(id: string) {
  await prisma.evaluation.delete({ where: { id } });
}

export async function listEvaluationsForUser(options: {
  evaluatorId?: string;
  all?: boolean;
}) {
  return prisma.evaluation.findMany({
    where: options.all ? undefined : { evaluatorId: options.evaluatorId },
    orderBy: { updatedAt: 'desc' },
    include: {
      initiative: { select: { id: true, nombre: true, status: true } },
      conversation: { select: { id: true, status: true, updatedAt: true } },
      evaluator: { select: { id: true, name: true } },
    },
  });
}

export async function listPreviousEvaluationsForInitiative(initiativeId: string) {
  return prisma.evaluation.findMany({
    where: {
      initiativeId,
      status: EvaluationStatus.COMPLETED,
    },
    orderBy: { evaluatedAt: 'desc' },
    select: {
      id: true,
      status: true,
      results: true,
      priority: true,
      businessCase: true,
      classificationSnapshot: true,
      workTableSnapshot: true,
      criteriaSnapshot: true,
      weightsSnapshot: true,
      configVersion: true,
      evaluatedAt: true,
      createdAt: true,
      evaluator: { select: { id: true, name: true, email: true } },
    },
  });
}
