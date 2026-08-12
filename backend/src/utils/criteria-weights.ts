import { prisma } from '../services/prisma.service.js';
import { AppError } from './AppError.js';

/**
 * Los pesos son decimales desde que el enunciado pidió 12.5%. Comparar la suma
 * con `!== 100` a secas rechazaría repartos válidos por el error de coma
 * flotante: 33.33 tres veces no da 100 exacto en binario. La tolerancia es muy
 * inferior a cualquier reparto que alguien escriba a mano.
 */
const WEIGHT_SUM_TOLERANCE = 1e-6;

export function weightsSumTo100(sum: number): boolean {
  return Math.abs(sum - 100) < WEIGHT_SUM_TOLERANCE;
}

/** Evita mostrar "99.99999999999999%" en el mensaje de error. */
export function formatWeight(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export function assertWeightsSumTo100(sum: number): void {
  if (weightsSumTo100(sum)) return;

  throw new AppError(
    `La suma de pesos de criterios activos debe ser exactamente 100%. Actual: ${formatWeight(sum)}%`,
    400,
  );
}

export async function assertActiveCriteriaWeightsSum100(
  excludeId?: string,
  next?: { peso: number; activo: boolean },
): Promise<void> {
  const active = await prisma.evaluationCriteria.findMany({
    where: {
      activo: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { peso: true },
  });

  let sum = active.reduce((total, item) => total + item.peso, 0);

  if (next?.activo) {
    sum += next.peso;
  }

  assertWeightsSumTo100(sum);
}
