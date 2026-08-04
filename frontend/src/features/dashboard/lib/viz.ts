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
] as const;

/** Taxonomy order from section 5.2 of the brief; the slot follows the category. */
export const CLASSIFICATION_ORDER = [
  'Innovación disruptiva',
  'Innovación adyacente',
  'Mejora incremental',
  'Mejora de procesos',
  'Solicitud operativa',
] as const;

export function colorForClassification(nombre: string): string {
  const index = CLASSIFICATION_ORDER.indexOf(nombre as (typeof CLASSIFICATION_ORDER)[number]);
  return VIZ_SLOTS[index >= 0 ? index : VIZ_SLOTS.length - 1];
}

export function formatCompact(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

export function percentOf(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
