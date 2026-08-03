import { cn } from '@/lib/utils';

type ScrollablePageProps = {
  children: React.ReactNode;
  className?: string;
  /** Max-width utility for the inner content column. */
  contentClassName?: string;
};

/**
 * Scroll lives on the outer shell; inner content grows naturally.
 * Avoid putting h-full + flex-col on the same node as overflow-y-auto,
 * or flex children (Cards) get compressed and clipped.
 */
export function ScrollablePage({
  children,
  className,
  contentClassName,
}: ScrollablePageProps) {
  return (
    <div className={cn('h-full min-h-0 overflow-y-auto', className)}>
      <div className={cn('mx-auto w-full', contentClassName)}>{children}</div>
    </div>
  );
}
