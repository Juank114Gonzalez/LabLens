import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: number | string;
  /** Signed change against the named period, e.g. "vs. 30 días previos". */
  delta?: { value: number; period: string };
  hint?: string;
  className?: string;
};

export function StatTile({ label, value, delta, hint, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-2xl border border-border/70 bg-card/60 p-4',
        className,
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-semibold">{value}</p>
      {delta ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {delta.value > 0 ? '+' : ''}
            {delta.value}
          </span>{' '}
          {delta.period}
        </p>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
