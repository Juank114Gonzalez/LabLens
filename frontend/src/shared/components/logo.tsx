import Link from 'next/link';
import { branding } from '@/config/branding';
import { routes } from '@/config/routes';
import { cn } from '@/lib/utils';

type LogoProps = {
  href?: string;
  className?: string;
  compact?: boolean;
};

export function Logo({ href = routes.dashboard, className, compact = false }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-baseline gap-1 font-heading tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <span className="text-xl font-semibold text-foreground transition-colors group-hover:text-primary sm:text-2xl">
        Lab
        <span className="text-primary">Lens</span>
      </span>
      {!compact ? (
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:inline">
          {branding.tagline}
        </span>
      ) : null}
    </Link>
  );
}
