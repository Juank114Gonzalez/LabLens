'use client';

import { useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export type TrendPoint = {
  date: string;
  lab: number;
  external: number;
};

type Props = {
  points: TrendPoint[];
};

const SERIES = [
  { key: 'lab', label: 'Al Laboratorio', color: 'var(--viz-1)' },
  { key: 'external', label: 'Enrutadas a otra área', color: 'var(--viz-2)' },
] as const;

const WIDTH = 720;
const HEIGHT = 200;
const PADDING = { top: 12, right: 12, bottom: 24, left: 28 };

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const step = Math.ceil(value / 4);
  return step * 4;
}

export function TrendLines({ points }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const max = useMemo(
    () => niceMax(Math.max(...points.map((item) => Math.max(item.lab, item.external)), 0)),
    [points],
  );

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const xAt = (index: number) =>
    PADDING.left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * plotWidth);
  const yAt = (value: number) => PADDING.top + plotHeight - (value / max) * plotHeight;

  const paths = SERIES.map((series) => ({
    ...series,
    d: points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xAt(index)} ${yAt(point[series.key])}`)
      .join(' '),
  }));

  const ticks = [0, max / 2, max];
  const active = hoverIndex !== null ? points[hoverIndex] : null;

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds || points.length === 0) return;
    const ratio = (event.clientX - bounds.left) / bounds.width;
    const x = ratio * WIDTH - PADDING.left;
    const index = Math.round((x / plotWidth) * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, index)));
  }

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-4">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              aria-hidden
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </li>
        ))}
      </ul>

      <div
        ref={containerRef}
        className="relative"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label="Iniciativas recibidas por día en los últimos 30 días, separadas entre las que quedan en el Laboratorio y las enrutadas a otras áreas"
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={0}
                y={yAt(tick) + 3}
                className="fill-muted-foreground"
                style={{ fontSize: 9 }}
              >
                {tick}
              </text>
            </g>
          ))}

          {paths.map((series) => (
            <path
              key={series.key}
              d={series.d}
              fill="none"
              stroke={series.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {hoverIndex !== null ? (
            <g>
              <line
                x1={xAt(hoverIndex)}
                x2={xAt(hoverIndex)}
                y1={PADDING.top}
                y2={PADDING.top + plotHeight}
                stroke="var(--border)"
                strokeWidth={1}
              />
              {SERIES.map((series) => (
                <circle
                  key={series.key}
                  cx={xAt(hoverIndex)}
                  cy={yAt(points[hoverIndex][series.key])}
                  r={4}
                  fill={series.color}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ))}
            </g>
          ) : null}

          {points.length > 0 ? (
            <>
              <text
                x={PADDING.left}
                y={HEIGHT - 6}
                className="fill-muted-foreground"
                style={{ fontSize: 9 }}
              >
                {format(parseISO(points[0].date), 'd MMM', { locale: es })}
              </text>
              <text
                x={WIDTH - PADDING.right}
                y={HEIGHT - 6}
                textAnchor="end"
                className="fill-muted-foreground"
                style={{ fontSize: 9 }}
              >
                {format(parseISO(points[points.length - 1].date), 'd MMM', { locale: es })}
              </text>
            </>
          ) : null}
        </svg>

        {active ? (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border border-border/70 bg-popover px-3 py-2 text-xs shadow-sm"
            style={{
              left: `${(xAt(hoverIndex ?? 0) / WIDTH) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-medium">
              {format(parseISO(active.date), "d 'de' MMMM", { locale: es })}
            </p>
            {SERIES.map((series) => (
              <p key={series.key} className="flex items-center gap-2 text-muted-foreground">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
                <span className="ml-auto font-medium tabular-nums text-foreground">
                  {active[series.key]}
                </span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
