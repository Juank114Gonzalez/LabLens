import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

export async function listClassifications() {
  return prisma.intelligentClassification.findMany({
    orderBy: { nombre: 'asc' },
  });
}

export async function getClassificationOrThrow(id: string) {
  const item = await prisma.intelligentClassification.findUnique({ where: { id } });
  if (!item) {
    throw new AppError('Intelligent classification not found', 404);
  }
  return item;
}

export async function createClassification(data: {
  nombre: string;
  descripcion: string;
  promptContext: string;
  activo?: boolean;
}) {
  return prisma.intelligentClassification.create({
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      promptContext: data.promptContext,
      activo: data.activo ?? true,
    },
  });
}

export async function updateClassification(
  id: string,
  data: Partial<{
    nombre: string;
    descripcion: string;
    promptContext: string;
    activo: boolean;
  }>,
) {
  return prisma.intelligentClassification.update({ where: { id }, data });
}

export async function deleteClassification(id: string) {
  await prisma.intelligentClassification.delete({ where: { id } });
}
