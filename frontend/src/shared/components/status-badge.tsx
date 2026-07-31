import { Badge } from '@/components/ui/badge';
import type { ConversationStatus } from '@/types/conversation';
import type { InitiativePipelineStatus } from '@/types/initiative';
import { cn } from '@/lib/utils';

const conversationLabels: Record<ConversationStatus, string> = {
  COLLECTING_INFORMATION: 'Recolectando información',
  READY_TO_EVALUATE: 'Lista para evaluar',
  COMPLETED: 'Finalizada',
};

const pipelineLabels: Record<InitiativePipelineStatus, string> = {
  collecting: 'Recolectando información',
  analyzing: 'Analizando',
  classifying: 'Clasificando',
  scoring: 'Calculando Score',
  business_case: 'Generando Business Case',
  completed: 'Finalizada',
};

const toneByStatus: Record<string, string> = {
  COLLECTING_INFORMATION: 'bg-accent text-accent-foreground',
  READY_TO_EVALUATE: 'bg-signal/20 text-signal',
  COMPLETED: 'bg-primary/15 text-primary',
  collecting: 'bg-accent text-accent-foreground',
  analyzing: 'bg-chart-4/20 text-chart-4',
  classifying: 'bg-chart-2/20 text-chart-2',
  scoring: 'bg-signal/20 text-signal',
  business_case: 'bg-primary/15 text-primary',
  completed: 'bg-primary/15 text-primary',
};

type StatusBadgeProps = {
  status: ConversationStatus | InitiativePipelineStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label =
    status in conversationLabels
      ? conversationLabels[status as ConversationStatus]
      : pipelineLabels[status as InitiativePipelineStatus];

  return (
    <Badge
      variant="secondary"
      className={cn(
        'rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        toneByStatus[status],
        className,
      )}
    >
      {label}
    </Badge>
  );
}
