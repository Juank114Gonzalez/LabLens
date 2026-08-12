import type { InitiativeStatus, SourceType } from '@/features/initiative/types';

export const SOURCE_LABELS: Record<SourceType, string> = {
  INTERNAL: 'Área interna de ACH',
  EXTERNAL_CONTRACTOR: 'Organización externa',
  INTERNATIONAL_REFERENCE: 'Referencia internacional',
};

export const INITIATIVE_STATUS_LABELS: Record<InitiativeStatus, string> = {
  DRAFT: 'Borrador',
  REGISTERED: 'Registrada',
  TRIAGED_LAB: 'En bandeja del Lab',
  TRIAGED_EXTERNAL: 'Enrutada a otra área',
  UNDER_REVIEW: 'En evaluación',
  EVALUATED: 'Evaluada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  ARCHIVED: 'Archivada',
};

/**
 * Tonos del badge de estado de la iniciativa. Mismo motivo que en el badge de
 * evaluación: `variant="secondary"` queda casi negro sobre la tarjeta, así que
 * el estado se pinta con el azul de la identidad salvo donde otro color informa
 * mejor — ámbar mientras algo está en curso, rojo para lo rechazado.
 */
const INITIATIVE_STATUS_TONES: Record<InitiativeStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  REGISTERED: 'bg-primary/20 text-lab',
  TRIAGED_LAB: 'bg-primary/20 text-lab',
  TRIAGED_EXTERNAL: 'bg-chart-4/20 text-chart-4',
  UNDER_REVIEW: 'bg-signal/20 text-signal',
  EVALUATED: 'bg-primary/20 text-lab',
  APPROVED: 'bg-success/20 text-success',
  REJECTED: 'bg-destructive/15 text-destructive',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

export function initiativeStatusTone(status: string): string {
  return INITIATIVE_STATUS_TONES[status as InitiativeStatus] ?? 'bg-primary/20 text-lab';
}

export const URGENCY_OPTIONS = ['Baja', 'Media', 'Alta'] as const;

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
