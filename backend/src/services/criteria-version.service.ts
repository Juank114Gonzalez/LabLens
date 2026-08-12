import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma.service.js';

/** Lo que se congela de cada criterio. */
export type CriterioVersionado = {
  id: string;
  nombre: string;
  descripcion: string;
  promptContext: string;
  peso: number;
  orden: number;
};

/**
 * Huella del contenido de una configuración.
 *
 * Cubre el `promptContext` además del peso a propósito: cambiar cómo se le
 * describe un criterio al modelo altera el resultado tanto como cambiar cuánto
 * pesa, así que también es una versión nueva. Se ordena por id para que el orden
 * en que la base devuelva las filas no invente versiones falsas.
 */
export function hashCriteria(criterios: CriterioVersionado[]): string {
  const normalizado = [...criterios]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => ({
      id: c.id,
      nombre: c.nombre.trim(),
      descripcion: c.descripcion.trim(),
      promptContext: c.promptContext.trim(),
      peso: c.peso,
      orden: c.orden,
    }));

  return createHash('sha256').update(JSON.stringify(normalizado)).digest('hex');
}

function aVersionados(filas: CriterioVersionado[]): CriterioVersionado[] {
  return filas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    promptContext: c.promptContext,
    peso: c.peso,
    orden: c.orden,
  }));
}

/**
 * Devuelve la versión que corresponde a una configuración, creándola solo si esa
 * combinación exacta no se había visto antes.
 *
 * Es idempotente: llamarla dos veces sin tocar los criterios devuelve la misma
 * fila. Por eso se puede invocar sin miedo en cada cambio y también al abrir una
 * evaluación, que es lo que garantiza que ninguna quede sin versión aunque los
 * criterios lleven meses sin tocarse.
 */
export async function ensureCriteriaVersion(criterios: CriterioVersionado[]) {
  const activos = aVersionados(criterios);
  const hash = hashCriteria(activos);

  const existente = await prisma.criteriaVersion.findUnique({ where: { hash } });
  if (existente) return existente;

  const totalPeso = activos.reduce((suma, c) => suma + c.peso, 0);

  // El número legible se calcula al insertar. Dos peticiones simultáneas podrían
  // pelearse por el mismo, así que el índice único sobre `hash` y `numero` decide
  // y se reintenta leyendo: la versión ya la creó el otro.
  const ultimo = await prisma.criteriaVersion.findFirst({
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });

  try {
    return await prisma.criteriaVersion.create({
      data: {
        numero: (ultimo?.numero ?? 0) + 1,
        hash,
        snapshot: activos as unknown as Prisma.InputJsonValue,
        totalPeso,
      },
    });
  } catch {
    const yaCreada = await prisma.criteriaVersion.findUnique({ where: { hash } });
    if (yaCreada) return yaCreada;
    throw new Error('No se pudo registrar la versión de criterios');
  }
}

/** Registra la configuración activa actual. Se llama tras cada cambio de criterios. */
export async function ensureCurrentCriteriaVersion() {
  const activos = await prisma.evaluationCriteria.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      promptContext: true,
      peso: true,
      orden: true,
    },
  });

  // Sin criterios activos no hay configuración que versionar; no es un error,
  // solo un estado transitorio mientras un admin reorganiza el catálogo.
  if (activos.length === 0) return null;

  return ensureCriteriaVersion(activos);
}

export async function listCriteriaVersions() {
  const versiones = await prisma.criteriaVersion.findMany({
    orderBy: { numero: 'desc' },
    include: { _count: { select: { evaluations: true } } },
  });

  return versiones.map((v) => ({
    id: v.id,
    numero: v.numero,
    totalPeso: v.totalPeso,
    createdAt: v.createdAt,
    snapshot: v.snapshot,
    evaluaciones: v._count.evaluations,
  }));
}
