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

/**
 * Tonos del badge de estado.
 *
 * `variant="secondary"` deja el badge casi negro sobre la tarjeta: `--secondary`
 * y `--card` se llevan seis centésimas de luminosidad. Estos tonos usan el azul
 * de la identidad y reservan el ámbar y el rojo para lo que de verdad los pide.
 */
const EVALUATION_STATUS_TONES: Record<EvaluationStatus, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-signal/20 text-signal',
  COMPLETED: 'bg-primary/20 text-lab',
  CANCELLED: 'bg-destructive/15 text-destructive',
};

export function evaluationStatusTone(value: string): string {
  return EVALUATION_STATUS_TONES[value as EvaluationStatus] ?? 'bg-primary/20 text-lab';
}

/**
 * Lee del `results` de una evaluación si el triage y el pipeline llegaron a
 * conclusiones distintas.
 *
 * `results` viaja como JSON sin tipar, así que se estrecha a mano. Devuelve
 * `null` tanto cuando coincidieron como cuando no hay nada que comparar —una
 * evaluación cerrada antes de que esto se registrara, o una iniciativa que nunca
 * pasó por triage—: en ningún caso hay un desacuerdo que mostrar.
 */
export function triageDisagreement(
  results: unknown,
): { clasificacion: boolean; mesa: boolean } | null {
  if (!results || typeof results !== 'object') return null;

  const tc = (results as { triageComparison?: unknown }).triageComparison;
  if (!tc || typeof tc !== 'object') return null;

  const { huboTriage, clasificacionCoincide, mesaCoincide } = tc as {
    huboTriage?: unknown;
    clasificacionCoincide?: unknown;
    mesaCoincide?: unknown;
  };
  if (huboTriage !== true) return null;

  // Solo `false` es desacuerdo. `null` significa que el triage se abstuvo de
  // clasificar, y abstenerse no es equivocarse.
  const clasificacion = clasificacionCoincide === false;
  const mesa = mesaCoincide === false;

  return clasificacion || mesa ? { clasificacion, mesa } : null;
}
