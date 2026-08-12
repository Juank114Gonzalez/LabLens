import { prisma } from './prisma.service.js';
import {
  createCriteria,
  deleteCriteria,
  getCriteriaOrThrow,
  listCriteria,
  updateCriteria,
} from '../repositories/criteria.repository.js';
import {
  assertActiveCriteriaWeightsSum100,
  assertWeightsSumTo100,
} from '../utils/criteria-weights.js';
import { ensureCurrentCriteriaVersion } from './criteria-version.service.js';
import type {
  CreateCriteriaDto,
  UpdateCriteriaDto,
} from '../validators/criteria.validator.js';

export async function listEvaluationCriteria() {
  return listCriteria();
}

export async function getEvaluationCriteria(id: string) {
  return getCriteriaOrThrow(id);
}

/*
 * Cada mutación registra la configuración resultante en el historial. Es
 * idempotente: si el cambio no alteró el contenido efectivo —reordenar sin tocar
 * pesos ni textos, por ejemplo— se reutiliza la versión existente en vez de
 * inventar una nueva.
 */
export async function createEvaluationCriteria(input: CreateCriteriaDto) {
  const activo = input.activo ?? true;
  await assertActiveCriteriaWeightsSum100(undefined, {
    peso: input.peso,
    activo,
  });
  const creado = await createCriteria({ ...input, activo });
  await ensureCurrentCriteriaVersion();
  return creado;
}

export async function updateEvaluationCriteria(id: string, input: UpdateCriteriaDto) {
  const current = await getCriteriaOrThrow(id);
  const next = {
    peso: input.peso ?? current.peso,
    activo: input.activo ?? current.activo,
  };
  await assertActiveCriteriaWeightsSum100(id, next);
  const actualizado = await updateCriteria(id, input);
  await ensureCurrentCriteriaVersion();
  return actualizado;
}

export async function deleteEvaluationCriteria(id: string) {
  const current = await getCriteriaOrThrow(id);
  if (current.activo) {
    await assertActiveCriteriaWeightsSum100(id, { peso: 0, activo: false });
  }
  await deleteCriteria(id);
  await ensureCurrentCriteriaVersion();
}

export async function reorderEvaluationCriteria(
  items: Array<{ id: string; orden: number; peso: number; activo: boolean }>,
) {
  const sum = items.filter((item) => item.activo).reduce((total, item) => total + item.peso, 0);
  assertWeightsSumTo100(sum);

  await prisma.$transaction(
    items.map((item) =>
      prisma.evaluationCriteria.update({
        where: { id: item.id },
        data: { orden: item.orden, peso: item.peso, activo: item.activo },
      }),
    ),
  );

  await ensureCurrentCriteriaVersion();
  return listCriteria();
}
