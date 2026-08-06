import Link from 'next/link';
import { branding } from '@/config/branding';
import { routes } from '@/config/routes';
import { AchLogo } from '@/shared/components/ach-logo';
import { cn } from '@/lib/utils';

type LogoProps = {
  href?: string;
  className?: string;
  compact?: boolean;
  /** Apila el subtítulo debajo del wordmark, como en la barra del wizard. */
  stacked?: boolean;
  /** Reemplaza el tagline por un rótulo de contexto ("Envía tu iniciativa"). */
  subtitle?: string;
  /**
   * Bloque institucional: la marca ACH arriba y el wordmark reducido debajo.
   * Es la jerarquía correcta dentro del producto — ACH es la organización, el
   * Lente de Innovación es la herramienta.
   */
  withAch?: boolean;
};

export function Logo({
  href = routes.dashboard,
  className,
  compact = false,
  stacked = false,
  subtitle,
  withAch = false,
}: LogoProps) {
  const caption = subtitle ?? branding.tagline;
  const columnar = stacked || withAch;

  return (
    <Link
      href={href}
      className={cn(
        'group font-heading tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        columnar ? 'inline-flex flex-col gap-0.5' : 'inline-flex items-baseline gap-2',
        withAch && 'items-start gap-2',
        className,
      )}
    >
      {withAch ? <AchLogo className="h-7" /> : null}

      {/* Wordmark de dos tonos: el azul cae en "Innovación", igual que el titular
          de la landing. Si el nombre cambia por env, esto no lo sigue — es arte. */}
      <span
        className={cn(
          'whitespace-nowrap font-semibold leading-none text-foreground',
          withAch ? 'text-sm' : 'text-xl sm:text-2xl',
        )}
      >
        Lente de{' '}
        <span className="text-lab transition-colors group-hover:text-primary">Innovación</span>
      </span>

      {!compact ? (
        <span
          className={cn(
            'text-[11px] font-medium leading-none text-muted-foreground',
            columnar ? '' : 'hidden uppercase tracking-[0.18em] sm:inline',
          )}
        >
          {caption}
        </span>
      ) : null}
    </Link>
  );
}
