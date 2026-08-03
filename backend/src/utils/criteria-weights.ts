import { prisma } from '../services/prisma.service.js';
import { AppError } from './AppError.js';

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

  if (sum !== 100) {
    throw new AppError(
      `La suma de pesos de criterios activos debe ser exactamente 100%. Actual: ${sum}%`,
      400,
    );
  }
}
