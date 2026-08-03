import { InitiativeStatus, Role } from '@prisma/client';
import {
  createInitiative,
  deleteInitiative,
  getInitiativeOrThrow,
  listInitiatives,
  replaceCompanyContacts,
  updateInitiative,
} from '../repositories/domain-initiative.repository.js';
import type {
  CreateInitiativeDto,
  RegisterInitiativeDto,
  UpdateInitiativeDto,
} from '../validators/initiative.validator.js';
import { registerInitiativeSchema } from '../validators/initiative.validator.js';
import { AppError } from '../utils/AppError.js';

function canViewAll(role: Role) {
  return role === Role.ADMIN || role === Role.EVALUATOR;
}

function assertDraftEditable(status: InitiativeStatus) {
  if (status !== InitiativeStatus.DRAFT) {
    throw new AppError('Solo las iniciativas en borrador pueden editarse', 409);
  }
}

export async function createDraftInitiative(
  userId: string,
  userName: string,
  input: CreateInitiativeDto = {},
) {
  const { companyContacts, ...fields } = input;
  return createInitiative({
    userId,
    data: {
      ...fields,
      diligenciadoPor: fields.diligenciadoPor?.trim() || userName,
      fechaDiligenciamiento: fields.fechaDiligenciamiento ?? new Date(),
      status: InitiativeStatus.DRAFT,
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
    isAdmin: actor.role === Role.ADMIN,
  });

  if (actor.role === Role.GENERATOR && existing.userId !== actor.id) {
    throw new AppError('Initiative not found', 404);
  }

  if (actor.role === Role.EVALUATOR) {
    throw new AppError('Forbidden', 403);
  }

  assertDraftEditable(existing.status);

  const { companyContacts, status: _status, ...fields } = input;

  if (companyContacts) {
    await replaceCompanyContacts(id, companyContacts);
  }

  return updateInitiative(id, {
    ...fields,
    status: InitiativeStatus.DRAFT,
  });
}

export async function registerInitiativeForActor(
  id: string,
  actor: { id: string; role: Role },
  input?: RegisterInitiativeDto,
) {
  const existing = await getInitiativeOrThrow(id, {
    userId: actor.id,
    isAdmin: actor.role === Role.ADMIN,
  });

  if (actor.role === Role.GENERATOR && existing.userId !== actor.id) {
    throw new AppError('Initiative not found', 404);
  }

  assertDraftEditable(existing.status);

  const fromExisting = {
    diligenciadoPor: existing.diligenciadoPor,
    fechaDiligenciamiento: existing.fechaDiligenciamiento,
    expectativaSolucion: existing.expectativaSolucion,
    nombre: existing.nombre,
    areaProcesoImpactado: existing.areaProcesoImpactado,
    areaInvolucrada: existing.areaInvolucrada,
    urgencia: existing.urgencia,
    impacto: existing.impacto,
    necesidad: existing.necesidad,
    porQueAhora: existing.porQueAhora,
    paraQue: existing.paraQue,
    comoSeResuelveHoy: existing.comoSeResuelveHoy,
    companyContacts: existing.companyContacts.map((c) => ({
      empresa: c.empresa,
      contacto: c.contacto,
      cargo: c.cargo,
      correo: c.correo,
      telefono: c.telefono,
    })),
  };

  const hasMeaningfulBody =
    Boolean(input) && Object.values(input!).some((value) => value !== undefined);

  const parsed = registerInitiativeSchema.parse(
    hasMeaningfulBody ? { ...fromExisting, ...input } : fromExisting,
  );

  if (existing.attachments.length === 0) {
    throw new AppError('Debe adjuntar al menos una evidencia', 400);
  }

  await replaceCompanyContacts(id, parsed.companyContacts);

  const { companyContacts: _contacts, ...fields } = parsed;

  return updateInitiative(id, {
    ...fields,
    status: InitiativeStatus.REGISTERED,
  });
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

  if (actor.role === Role.GENERATOR && existing.status !== InitiativeStatus.DRAFT) {
    throw new AppError('Solo se pueden eliminar borradores', 409);
  }

  await deleteInitiative(id);
}

/** Stub for next increment: start evaluation + conversation. */
export async function startEvaluationStub() {
  throw new AppError(
    'El flujo de evaluación se implementará en el siguiente incremento',
    501,
  );
}
