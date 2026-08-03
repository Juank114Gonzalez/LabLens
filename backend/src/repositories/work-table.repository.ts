import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

export async function listWorkTables() {
  return prisma.workTable.findMany({
    orderBy: { nombre: 'asc' },
  });
}

export async function getWorkTableOrThrow(id: string) {
  const item = await prisma.workTable.findUnique({ where: { id } });
  if (!item) {
    throw new AppError('Work table not found', 404);
  }
  return item;
}

export async function createWorkTable(data: {
  nombre: string;
  descripcion: string;
  promptContext: string;
  activo?: boolean;
}) {
  return prisma.workTable.create({
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      promptContext: data.promptContext,
      activo: data.activo ?? true,
    },
  });
}

export async function updateWorkTable(
  id: string,
  data: Partial<{
    nombre: string;
    descripcion: string;
    promptContext: string;
    activo: boolean;
  }>,
) {
  return prisma.workTable.update({ where: { id }, data });
}

export async function deleteWorkTable(id: string) {
  await prisma.workTable.delete({ where: { id } });
}
