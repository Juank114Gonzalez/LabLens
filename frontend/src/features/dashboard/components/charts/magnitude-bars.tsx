'use client';

export type MagnitudeBar = {
  key: string;
  label: string;
  value: number;
};

type Props = {
  bars: MagnitudeBar[];
  emptyLabel?: string;
};

/**
 * Comparing magnitude across a few named categories: horizontal bars in a single
 * hue. Identity here is the row label, not the color, so one hue is the right
 * call — categorical slots are reserved for charts where the series is the subject.
 */
export function MagnitudeBars({ bars, emptyLabel = 'Sin datos todavía' }: Props) {
  const max = Math.max(...bars.map((item) => item.value), 0);

  if (max === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {bars.map((item) => (
        <li key={item.key} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-r-[4px] bg-[var(--viz-1)]"
              style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
