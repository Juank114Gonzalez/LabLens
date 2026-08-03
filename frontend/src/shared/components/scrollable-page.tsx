import { cn } from '@/lib/utils';

type ScrollablePageProps = {
  children: React.ReactNode;
  className?: string;
};

/** Page wrapper for AppShell main: fills height and scrolls when content overflows. */
export function ScrollablePage({ children, className }: ScrollablePageProps) {
  return (
    <div className={cn('h-full min-h-0 overflow-y-auto', className)}>{children}</div>
  );
}
