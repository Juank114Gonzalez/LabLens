import { AchLogo } from '@/shared/components/ach-logo';
import { cn } from '@/lib/utils';

/**
 * Grafo del Comité Virtual: las iniciativas que entran (nodos satélite) se
 * enrutan hacia el Laboratorio (nodo central). Es decorativo — `aria-hidden`,
 * sin texto que dependa de él para entenderse.
 *
 * La animación se define en `globals.css` (clases `hero-*`) y está toda dentro
 * de `prefers-reduced-motion: no-preference`. Aquí solo se calculan las
 * longitudes de arista y los retardos que la orquestan.
 */

const CENTER = { x: 200, y: 158 };
const SATELLITE_SIZE = 46;
const CENTER_SIZE = 84;
/** Largo del guión que viaja por la arista; debe coincidir con `.hero-pulse`. */
const PULSE_DASH = 5;

const SATELLITES = [
  { x: 200, y: 46 },
  { x: 308, y: 102 },
  { x: 322, y: 208 },
  { x: 202, y: 268 },
  { x: 86, y: 216 },
  { x: 70, y: 100 },
] as const;

const DOTS = [
  { x: 142, y: 78, r: 2.4 },
  { x: 268, y: 62, r: 1.8 },
  { x: 348, y: 152, r: 2.2 },
  { x: 138, y: 262, r: 2 },
  { x: 44, y: 168, r: 1.8 },
  { x: 262, y: 246, r: 2.4 },
] as const;

/**
 * `--edge-len` alimenta el `stroke-dasharray` del trazado; `--edge-start` es el
 * desfase inicial del pulso, negativo para que entre por el extremo del satélite
 * y viaje hacia el centro (y no al revés).
 */
const EDGES = SATELLITES.map((node, index) => {
  const length = Math.hypot(node.x - CENTER.x, node.y - CENTER.y);
  return {
    ...node,
    length: Math.round(length * 100) / 100,
    start: -(Math.round(length * 100) / 100 + PULSE_DASH),
    drawDelay: `${0.35 + index * 0.09}s`,
    nodeDelay: `${0.6 + index * 0.09}s`,
    // El bucle ambiente arranca cuando la entrada ya terminó.
    pulseDelay: `${1.6 + index * 0.6}s`,
  };
});

export function HeroNetwork({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox="0 0 400 320"
        className="w-full"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="hero-bloom" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              className="text-primary"
              stopColor="currentColor"
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              className="text-primary"
              stopColor="currentColor"
              stopOpacity="0"
            />
          </radialGradient>
        </defs>

        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r="150"
          fill="url(#hero-bloom)"
          className="hero-bloom"
        />

        {EDGES.map((edge) => (
          <line
            key={`edge-${edge.x}-${edge.y}`}
            x1={CENTER.x}
            y1={CENTER.y}
            x2={edge.x}
            y2={edge.y}
            className="hero-edge stroke-primary/35"
            strokeWidth="1"
            style={
              {
                '--edge-len': edge.length,
                '--delay': edge.drawDelay,
              } as React.CSSProperties
            }
          />
        ))}

        {EDGES.map((edge) => (
          <line
            key={`pulse-${edge.x}-${edge.y}`}
            x1={CENTER.x}
            y1={CENTER.y}
            x2={edge.x}
            y2={edge.y}
            className="hero-pulse stroke-lab"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={
              {
                '--edge-len': edge.length,
                '--edge-start': edge.start,
                '--delay': edge.pulseDelay,
              } as React.CSSProperties
            }
          />
        ))}

        {DOTS.map((dot, index) => (
          <circle
            key={`dot-${dot.x}-${dot.y}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            className="hero-dot fill-primary/55"
            style={{ '--delay': `${index * 0.5}s` } as React.CSSProperties}
          />
        ))}

        {EDGES.map((node) => {
          const x = node.x - SATELLITE_SIZE / 2;
          const y = node.y - SATELLITE_SIZE / 2;
          return (
            <g
              key={`node-${node.x}-${node.y}`}
              className="hero-node"
              style={{ '--delay': node.nodeDelay } as React.CSSProperties}
            >
              <rect
                x={x}
                y={y}
                width={SATELLITE_SIZE}
                height={SATELLITE_SIZE}
                rx="13"
                className="fill-card stroke-primary/30"
                strokeWidth="1"
              />
              {[0, 1, 2].map((line) => (
                <rect
                  key={line}
                  x={x + 13}
                  y={y + 17 + line * 6}
                  width={line === 2 ? 12 : 20}
                  height="2"
                  rx="1"
                  className="fill-primary/60"
                />
              ))}
            </g>
          );
        })}

        <g className="hero-center">
          <rect
            x={CENTER.x - CENTER_SIZE / 2}
            y={CENTER.y - CENTER_SIZE / 2}
            width={CENTER_SIZE}
            height={CENTER_SIZE}
            rx="22"
            className="fill-card stroke-primary/60"
            strokeWidth="1.5"
          />
          {[0, 1, 2].map((dot) => (
            <circle
              key={dot}
              cx={CENTER.x - 10 + dot * 10}
              cy={CENTER.y - 16}
              r="2"
              className="fill-primary"
            />
          ))}
        </g>
      </svg>

      {/*
        La marca va superpuesta en vez de dibujada dentro del SVG: es un PNG y
        embeberlo como <image> perdería la optimización de next/image. Los
        porcentajes siguen al nodo central del viewBox (200/400, 158/320).
      */}
      <span className="hero-mark pointer-events-none absolute top-[49.4%] left-1/2 w-[14%] -translate-x-1/2 -translate-y-1/2">
        <AchLogo className="h-auto w-full" />
      </span>
    </div>
  );
}
