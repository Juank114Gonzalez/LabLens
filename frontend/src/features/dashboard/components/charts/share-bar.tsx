'use client';

import { percentOf } from '@/features/dashboard/lib/viz';

export type ShareSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  segments: ShareSegment[];
  emptyLabel?: string;
};

/**
 * Part-to-whole across long-named categories: a horizontal stacked bar plus a
 * legend that carries the values. The legend doubles as the direct labelling the
 * light-mode palette requires — identity never rests on color alone.
 */
export function ShareBar({ segments, emptyLabel = 'Sin datos todavía' }: Props) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const visible = segments.filter((item) => item.value > 0);

  return (
    <div className="space-y-4">
      <div
        className="flex h-6 w-full gap-[2px] overflow-hidden"
        role="img"
        aria-label={visible
          .map((item) => `${item.label}: ${item.value}`)
          .join(', ')}
      >
        {visible.map((item, index) => (
          <div
            key={item.key}
            title={`${item.label}: ${item.value} (${percentOf(item.value, total)}%)`}
            style={{
              backgroundColor: item.color,
              flexGrow: item.value,
              flexBasis: 0,
              borderTopLeftRadius: index === 0 ? 4 : 0,
              borderBottomLeftRadius: index === 0 ? 4 : 0,
              borderTopRightRadius: index === visible.length - 1 ? 4 : 0,
              borderBottomRightRadius: index === visible.length - 1 ? 4 : 0,
            }}
          />
        ))}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {segments.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums">{item.value}</span>
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
              {percentOf(item.value, total)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
