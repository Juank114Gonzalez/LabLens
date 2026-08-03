import { InitiativeStatus, Role } from '@prisma/client';
import {
  createInitiative,
  deleteInitiative,
  getInitiativeOrThrow,
  listInitiatives,
  updateInitiative,
} from '../repositories/domain-initiative.repository.js';
import type {
  CreateInitiativeDto,
  UpdateInitiativeDto,
} from '../validators/initiative.validator.js';
import { AppError } from '../utils/AppError.js';

function canViewAll(role: Role) {
  return role === Role.ADMIN || role === Role.EVALUATOR;
}

export async function createInitiativeForUser(
  userId: string,
  input: CreateInitiativeDto,
) {
  const { companyContacts, ...fields } = input;
  return createInitiative({
    userId,
    data: {
      ...fields,
      status: fields.status ?? InitiativeStatus.REGISTERED,
    },
    companyContacts,
  });
}

export async function listInitiativesForActor(actor: {
  id: string;
  role: Role;
}) {
  return listInitiatives({
    userId: actor.id,
    isAdmin: canViewAll(actor.role),
  });
}

export async function getInitiativeForActor(
  id: string,
  actor: { id: string; role: Role },
) {
  return getInitiativeOrThrow(id, {
    userId: actor.id,
    isAdmin: canViewAll(actor.role),
  });
}

export async function updateInitiativeForActor(
  id: string,
  actor: { id: string; role: Role },
  input: UpdateInitiativeDto,
) {
  const existing = await getInitiativeOrThrow(id, {
    userId: actor.id,
    isAdmin: actor.role === Role.ADMIN || actor.role === Role.EVALUATOR,
  });

  if (actor.role === Role.GENERATOR && existing.userId !== actor.id) {
    throw new AppError('Initiative not found', 404);
  }

  if (actor.role === Role.EVALUATOR) {
    const keys = Object.keys(input).filter((key) => input[key as keyof UpdateInitiativeDto] !== undefined);
    if (keys.some((key) => key !== 'status')) {
      throw new AppError('Evaluators can only update initiative status', 403);
    }
  }

  const { companyContacts: _contacts, ...fields } = input;

  return updateInitiative(id, fields);
}

export async function deleteInitiativeForActor(
  id: string,
  actor: { id: string; role: Role },
) {
  const existing = await getInitiativeOrThrow(id, {
    userId: actor.id,
    isAdmin: actor.role === Role.ADMIN,
  });

  if (actor.role !== Role.ADMIN && existing.userId !== actor.id) {
    throw new AppError('Initiative not found', 404);
  }

  await deleteInitiative(id);
}
