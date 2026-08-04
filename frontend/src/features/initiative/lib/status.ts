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

export const URGENCY_OPTIONS = ['Baja', 'Media', 'Alta', 'Crítica'] as const;
export const IMPACT_OPTIONS = ['Bajo', 'Medio', 'Alto', 'Muy alto'] as const;

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
