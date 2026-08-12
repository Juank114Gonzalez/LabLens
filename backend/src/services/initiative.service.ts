import { InitiativeStatus, Role } from '@prisma/client';
import {
  copyInitiative,
  createInitiative,
  deleteInitiative,
  getInitiativeOrThrow,
  getInitiativeStats,
  listInitiatives,
  listInitiativeIdsForTriage,
  replaceCompanyContacts,
  updateInitiative,
} from '../repositories/domain-initiative.repository.js';
import { runTriage } from './triage.service.js';
import type {
  CreateInitiativeDto,
  InitiativeFiltersDto,
  RegisterInitiativeDto,
  UpdateInitiativeDto,
} from '../validators/initiative.validator.js';
import { registerInitiativeSchema } from '../validators/initiative.validator.js';
import { AppError } from '../utils/AppError.js';

function canViewAll(role: Role) {
  return role === Role.ADMIN || role === Role.EVALUATOR;
}

/**
 * Una iniciativa deja de ser editable en cuanto sale de borrador, que en la
 * práctica es en cuanto pasa por triage: a partir de ahí es el registro de lo
 * que se envió y lo que se dictaminó. Para iterar sobre ella se saca una copia.
 */
function assertDraftEditable(status: InitiativeStatus) {
  if (status !== InitiativeStatus.DRAFT) {
    throw new AppError(
      'Esta iniciativa ya fue clasificada y queda como registro. Sácale una copia para modificarla.',
      409,
    );
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

export async function listInitiativesForActor(
  actor: { id: string; role: Role },
  filters?: InitiativeFiltersDto,
) {
  return listInitiatives({
    userId: actor.id,
    isAdmin: canViewAll(actor.role),
    filters,
  });
}

export async function getInitiativeStatsForActor(actor: { id: string; role: Role }) {
  if (!canViewAll(actor.role)) {
    throw new AppError('Forbidden', 403);
  }
  return getInitiativeStats();
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

  const registered = await updateInitiative(id, {
    ...fields,
    status: InitiativeStatus.REGISTERED,
  });

  /*
   * El triage también corre para el canal interno. Antes solo lo disparaba el
   * formulario público, así que una iniciativa creada en el back-office se
   * quedaba sin clasificar hasta que alguien abría una evaluación a mano: el
   * "primera línea de análisis" dependía del canal, que no tiene sentido.
   *
   * Igual que en el envío público, un fallo no revierte el registro: la
   * iniciativa queda REGISTERED y la recoge el barrido de pendientes.
   */
  try {
    await runTriage(id);
  } catch (error) {
    console.error('[InitiativeService] Triage failed on register', error);
  }

  return registered;
}

export async function copyInitiativeForActor(
  id: string,
  actor: { id: string; role: Role },
) {
  if (!canViewAll(actor.role)) {
    throw new AppError('Forbidden', 403);
  }

  // Se comprueba el acceso con las reglas normales antes de duplicar nada.
  await getInitiativeOrThrow(id, { userId: actor.id, isAdmin: canViewAll(actor.role) });

  return copyInitiative(id, actor.id);
}

/**
 * Vuelve a clasificar una sola iniciativa.
 *
 * No contradice que los originales sean inmutables: reclasificar no toca lo que
 * la persona escribió, solo vuelve a pasar el mismo contenido por el triage. Es
 * la herramienta para corregir un dictamen puntual sin tener que barrer todo el
 * histórico, y la usa un evaluador —que es quien detecta el error—, no solo un
 * administrador.
 */
export async function retriageInitiativeForActor(
  id: string,
  actor: { id: string; role: Role },
) {
  if (!canViewAll(actor.role)) {
    throw new AppError('Forbidden', 403);
  }

  const existing = await getInitiativeOrThrow(id, {
    userId: actor.id,
    isAdmin: canViewAll(actor.role),
  });

  // Un borrador todavía se está escribiendo: clasificarlo daría un dictamen
  // sobre un texto a medias. Se registra primero.
  if (existing.status === InitiativeStatus.DRAFT) {
    throw new AppError('Registra la iniciativa antes de clasificarla', 409);
  }

  return runTriage(id);
}

export type BarridoTriage = {
  alcance: 'pendientes' | 'todas';
  total: number;
  triadas: number;
  fallidas: number;
};

/**
 * Corre el triage sobre varias iniciativas.
 *
 * Secuencial y no en paralelo a propósito: cada pasada es una llamada al modelo,
 * y lanzar cincuenta a la vez agotaría el límite de tasa y dejaría el barrido a
 * medias sin saber dónde. Un fallo individual no aborta el resto: se cuenta y se
 * sigue, igual que en el envío público, donde el triage nunca puede tumbar la
 * operación que lo invocó.
 */
export async function runTriageSweep(
  actor: { id: string; role: Role },
  alcance: 'pendientes' | 'todas',
): Promise<BarridoTriage> {
  if (actor.role !== Role.ADMIN) {
    throw new AppError('Solo un administrador puede correr el barrido de triage', 403);
  }

  const ids = await listInitiativeIdsForTriage(alcance);
  let triadas = 0;
  let fallidas = 0;

  for (const id of ids) {
    try {
      await runTriage(id);
      triadas += 1;
    } catch (error) {
      fallidas += 1;
      console.error('[InitiativeService] Triage sweep failed for', id, error);
    }
  }

  return { alcance, total: ids.length, triadas, fallidas };
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

  if (actor.role !== Role.ADMIN && existing.status !== InitiativeStatus.DRAFT) {
    throw new AppError('Solo se pueden eliminar borradores', 409);
  }

  await deleteInitiative(id);
}

export { startEvaluationForInitiative as startEvaluation } from './evaluation.service.js';
