import type { ReadinessStatus } from '@/types/evaluation';

/** Espejo del enum `EvaluationStatus` de Prisma. */
export type EvaluationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const READINESS_LABELS: Record<ReadinessStatus, string> = {
  INSUFFICIENT: 'Información insuficiente',
  IN_PROGRESS: 'En progreso',
  READY: 'Lista para evaluar',
};

/**
 * Los valores del enum siguen siendo identificadores internos; solo se traducen
 * al mostrarlos.
 *
 * Si el backend introduce un estado que el frontend todavía no conoce, se
 * devuelve el valor crudo en lugar de una cadena vacía: es feo, pero deja ver
 * que existe algo nuevo en vez de esconderlo.
 */
export function evaluationStatusLabel(value: string): string {
  return EVALUATION_STATUS_LABELS[value as EvaluationStatus] ?? value;
}

export function readinessLabel(value: string): string {
  return READINESS_LABELS[value as ReadinessStatus] ?? value;
}
