import { InitiativeStatus, type Prisma } from '@prisma/client';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

const initiativeInclude = {
  companyContacts: true,
  attachments: true,
} satisfies Prisma.InitiativeInclude;

export async function createInitiative(input: {
  userId: string;
  data: Prisma.InitiativeCreateWithoutUserInput;
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
      userId: input.userId,
      status: input.data.status ?? InitiativeStatus.REGISTERED,
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

export async function getInitiativeOrThrow(id: string, options: {
  userId?: string;
  isAdmin: boolean;
}) {
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

export async function deleteInitiative(id: string) {
  await prisma.initiative.delete({ where: { id } });
}
