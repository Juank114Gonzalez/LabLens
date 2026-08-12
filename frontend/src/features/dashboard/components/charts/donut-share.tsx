'use client';

import { percentOf } from '@/features/dashboard/lib/viz';

export type DonutSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  segments: DonutSegment[];
  /** Rótulo del hueco central. */
  totalLabel?: string;
  emptyLabel?: string;
};

const TAMANO = 168;
const GROSOR = 26;
const RADIO = (TAMANO - GROSOR) / 2;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/**
 * Reparto parte-todo en dona.
 *
 * Se dibuja con `stroke-dasharray` sobre un solo círculo por segmento en vez de
 * con arcos `path`: no hace falta trigonometría, no hay casos límite con un
 * único segmento del 100% —que en `path` degenera y desaparece— y el navegador
 * interpola los bordes sin costuras.
 *
 * La leyenda lleva los valores porque el color no puede ser el único portador de
 * la identidad: con nueve áreas hay tonos que se parecen, y quien no distinga
 * colores necesita leerlo igual.
 */
export function DonutShare({
  segments,
  totalLabel = 'iniciativas',
  emptyLabel = 'Sin datos todavía',
}: Props) {
  const total = segments.reduce((suma, item) => suma + item.value, 0);

  if (total === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  const visibles = segments.filter((item) => item.value > 0);

  let acumulado = 0;
  const arcos = visibles.map((item) => {
    const largo = (item.value / total) * CIRCUNFERENCIA;
    const offset = acumulado;
    acumulado += largo;
    return { ...item, largo, offset };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative shrink-0">
        <svg
          width={TAMANO}
          height={TAMANO}
          viewBox={`0 0 ${TAMANO} ${TAMANO}`}
          role="img"
          aria-label={visibles.map((i) => `${i.label}: ${i.value}`).join(', ')}
        >
          {/* -90° para que el primer segmento arranque arriba y no a las 3. */}
          <g transform={`rotate(-90 ${TAMANO / 2} ${TAMANO / 2})`}>
            {arcos.map((arco) => (
              <circle
                key={arco.key}
                cx={TAMANO / 2}
                cy={TAMANO / 2}
                r={RADIO}
                fill="none"
                stroke={arco.color}
                strokeWidth={GROSOR}
                strokeDasharray={`${arco.largo} ${CIRCUNFERENCIA - arco.largo}`}
                strokeDashoffset={-arco.offset}
              >
                <title>{`${arco.label}: ${arco.value} (${percentOf(arco.value, total)}%)`}</title>
              </circle>
            ))}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-muted-foreground text-[11px]">{totalLabel}</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {segments.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground min-w-0 flex-1 truncate">{item.label}</span>
            <span className="font-medium tabular-nums">{item.value}</span>
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
              {percentOf(item.value, total)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
