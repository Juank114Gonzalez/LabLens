import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

export async function listCriteria() {
  return prisma.evaluationCriteria.findMany({
    orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function getCriteriaOrThrow(id: string) {
  const item = await prisma.evaluationCriteria.findUnique({ where: { id } });
  if (!item) {
    throw new AppError('Evaluation criteria not found', 404);
  }
  return item;
}

export async function createCriteria(data: {
  nombre: string;
  descripcion: string;
  promptContext: string;
  peso: number;
  activo?: boolean;
  orden?: number;
}) {
  return prisma.evaluationCriteria.create({
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      promptContext: data.promptContext,
      peso: data.peso,
      activo: data.activo ?? true,
      orden: data.orden ?? 0,
    },
  });
}

export async function updateCriteria(
  id: string,
  data: Partial<{
    nombre: string;
    descripcion: string;
    promptContext: string;
    peso: number;
    activo: boolean;
    orden: number;
  }>,
) {
  return prisma.evaluationCriteria.update({ where: { id }, data });
}

export async function deleteCriteria(id: string) {
  await prisma.evaluationCriteria.delete({ where: { id } });
}
