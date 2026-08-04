import { InitiativeStatus, type Prisma } from '@prisma/client';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

const initiativeInclude = {
  companyContacts: true,
  attachments: true,
  user: {
    select: { id: true, name: true, email: true },
  },
  triageClassification: { select: { id: true, nombre: true } },
  triageWorkTable: { select: { id: true, nombre: true, notificationEmail: true } },
  evaluations: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      evaluator: { select: { id: true, name: true, email: true } },
      classification: { select: { id: true, nombre: true } },
      workTable: { select: { id: true, nombre: true } },
    },
  },
} satisfies Prisma.InitiativeInclude;

type InitiativeScalarCreateInput = Omit<
  Prisma.InitiativeUncheckedCreateInput,
  'id' | 'userId' | 'companyContacts' | 'attachments' | 'evaluations'
>;

export async function createInitiative(input: {
  userId?: string | null;
  data?: InitiativeScalarCreateInput;
  companyContacts?: Array<{
    empresa: string;
    contacto: string;
    cargo: string;
    correo: string;
    telefono: string;
  }>;
}) {
  return prisma.initiative.create({
    data: {
      ...input.data,
      userId: input.userId ?? null,
      status: input.data?.status ?? InitiativeStatus.DRAFT,
      companyContacts: input.companyContacts?.length
        ? { create: input.companyContacts }
        : undefined,
    },
    include: initiativeInclude,
  });
}

export async function listInitiatives(options: {
  userId?: string;
  isAdmin: boolean;
}) {
  return prisma.initiative.findMany({
    where: options.isAdmin ? undefined : { userId: options.userId },
    orderBy: { updatedAt: 'desc' },
    include: initiativeInclude,
  });
}

export async function findInitiativeById(id: string) {
  return prisma.initiative.findUnique({
    where: { id },
    include: initiativeInclude,
  });
}

export async function getInitiativeOrThrow(
  id: string,
  options: {
    userId?: string;
    isAdmin: boolean;
  },
) {
  const initiative = await findInitiativeById(id);
  if (!initiative) {
    throw new AppError('Initiative not found', 404);
  }
  if (!options.isAdmin && initiative.userId !== options.userId) {
    throw new AppError('Initiative not found', 404);
  }
  return initiative;
}

export async function updateInitiative(
  id: string,
  data: Prisma.InitiativeUpdateInput,
) {
  return prisma.initiative.update({
    where: { id },
    data,
    include: initiativeInclude,
  });
}

export async function applyTriageResult(
  id: string,
  data: {
    status: InitiativeStatus;
    triageClassificationId: string;
    triageWorkTableId: string;
    triageReasoning: string;
    triageConfidence: number;
    triagedAt: Date;
  },
) {
  return prisma.initiative.update({
    where: { id },
    data,
    include: initiativeInclude,
  });
}

export async function markNotificationSent(id: string, sentAt: Date) {
  await prisma.initiative.update({
    where: { id },
    data: { notificationSentAt: sentAt },
  });
}

export async function replaceCompanyContacts(
  initiativeId: string,
  contacts: Array<{
    empresa: string;
    contacto: string;
    cargo: string;
    correo: string;
    telefono: string;
  }>,
) {
  await prisma.$transaction([
    prisma.companyContact.deleteMany({ where: { initiativeId } }),
    prisma.companyContact.createMany({
      data: contacts.map((contact) => ({ ...contact, initiativeId })),
    }),
  ]);
}

export async function deleteInitiative(id: string) {
  await prisma.initiative.delete({ where: { id } });
}
