import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

export type DateGroup = 'today' | 'yesterday' | 'week' | 'older';

export function groupDateLabel(value: string | Date): DateGroup {
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'week';
  return 'older';
}

export const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  week: 'Esta semana',
  older: 'Anteriores',
};

export function formatShortDate(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, "d MMM yyyy · HH:mm", { locale: es });
}
