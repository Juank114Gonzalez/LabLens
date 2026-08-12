import { AREA_OPTIONS } from '@/features/submit/schemas/public-initiative.schema';

/**
 * Categorical slots for the Lab dashboard.
 *
 * Fixed order, assigned by entity and never cycled: a filter that drops a series
 * must not repaint the survivors. The hex values live in `globals.css` as
 * `--viz-1..5` (one set per mode, each validated against its own surface).
 */
export const VIZ_SLOTS = [
  'var(--viz-1)',
  'var(--viz-2)',
  'var(--viz-3)',
  'var(--viz-4)',
  'var(--viz-5)',
  'var(--viz-6)',
  'var(--viz-7)',
  'var(--viz-8)',
  'var(--viz-9)',
] as const;

/** Taxonomy order from section 5.2 of the brief; the slot follows the category. */
export const CLASSIFICATION_ORDER = [
  'Innovación disruptiva',
  'Innovación adyacente',
  'Mejora incremental',
  'Mejora de procesos',
  'Solicitud operativa',
] as const;

/** Ranura para lo que no está en su catálogo. Fija, para que no se mueva al añadir slots. */
const SLOT_DESCONOCIDO = 'var(--viz-9)';

export function colorForClassification(nombre: string): string {
  const index = CLASSIFICATION_ORDER.indexOf(nombre as (typeof CLASSIFICATION_ORDER)[number]);
  return index >= 0 ? VIZ_SLOTS[index] : SLOT_DESCONOCIDO;
}

/**
 * Áreas ordenadas igual que en el formulario público, para que el color de un
 * área no dependa de cuántas iniciativas tenga ni de qué filtro esté activo.
 */
const AREA_ORDER = [...AREA_OPTIONS].sort((a, b) => a.localeCompare(b, 'es'));

export function colorForArea(area: string): string {
  const index = AREA_ORDER.indexOf(area as (typeof AREA_ORDER)[number]);
  return index >= 0 && index < VIZ_SLOTS.length ? VIZ_SLOTS[index] : SLOT_DESCONOCIDO;
}

export function formatCompact(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

export function percentOf(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
