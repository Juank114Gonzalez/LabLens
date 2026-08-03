import { prisma } from './prisma.service.js';
import {
  createCriteria,
  deleteCriteria,
  getCriteriaOrThrow,
  listCriteria,
  updateCriteria,
} from '../repositories/criteria.repository.js';
import { assertActiveCriteriaWeightsSum100 } from '../utils/criteria-weights.js';
import { AppError } from '../utils/AppError.js';
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

export async function createEvaluationCriteria(input: CreateCriteriaDto) {
  const activo = input.activo ?? true;
  await assertActiveCriteriaWeightsSum100(undefined, {
    peso: input.peso,
    activo,
  });
  return createCriteria({ ...input, activo });
}

export async function updateEvaluationCriteria(id: string, input: UpdateCriteriaDto) {
  const current = await getCriteriaOrThrow(id);
  const next = {
    peso: input.peso ?? current.peso,
    activo: input.activo ?? current.activo,
  };
  await assertActiveCriteriaWeightsSum100(id, next);
  return updateCriteria(id, input);
}

export async function deleteEvaluationCriteria(id: string) {
  const current = await getCriteriaOrThrow(id);
  if (current.activo) {
    await assertActiveCriteriaWeightsSum100(id, { peso: 0, activo: false });
  }
  await deleteCriteria(id);
}

export async function reorderEvaluationCriteria(
  items: Array<{ id: string; orden: number; peso: number; activo: boolean }>,
) {
  const sum = items.filter((item) => item.activo).reduce((total, item) => total + item.peso, 0);
  if (sum !== 100) {
    throw new AppError(
      `La suma de pesos de criterios activos debe ser exactamente 100%. Actual: ${sum}%`,
      400,
    );
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.evaluationCriteria.update({
        where: { id: item.id },
        data: { orden: item.orden, peso: item.peso, activo: item.activo },
      }),
    ),
  );

  return listCriteria();
}
