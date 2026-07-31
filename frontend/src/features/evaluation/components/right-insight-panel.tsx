'use client';

import { useQuery } from '@tanstack/react-query';
import { PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getConversation } from '@/features/conversation/services/conversation.service';
import { AttributeChecklist } from '@/features/evaluation/components/attribute-checklist';
import { CompletionCard } from '@/features/evaluation/components/completion-card';
import { EvaluationResultPanel } from '@/features/evaluation/components/evaluation-result-panel';
import { useUiStore } from '@/stores/ui.store';

type RightInsightPanelProps = {
  conversationId?: string;
};

export function RightInsightPanel({ conversationId }: RightInsightPanelProps) {
  const setRightPanelOpen = useUiStore((state) => state.setRightPanelOpen);

  const query = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: Boolean(conversationId),
  });

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-border/70 bg-sidebar/40">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p className="font-heading text-sm font-medium">Avance de evaluación</p>
          <p className="text-xs text-muted-foreground">Panel del Comité Virtual</p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 lg:hidden"
          onClick={() => setRightPanelOpen(false)}
          aria-label="Cerrar panel"
        >
          <PanelRightClose className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!conversationId ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
            Selecciona o crea una iniciativa para ver el progreso de atributos y la
            evaluación.
          </div>
        ) : query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : query.data ? (
          query.data.status === 'COMPLETED' && query.data.evaluation ? (
            <EvaluationResultPanel evaluation={query.data.evaluation} />
          ) : (
            <div className="space-y-3">
              <CompletionCard completion={query.data.completion} />
              <AttributeChecklist data={query.data.initiativeData} />
            </div>
          )
        ) : (
          <div className="text-sm text-muted-foreground">No hay datos disponibles.</div>
        )}
      </div>
    </aside>
  );
}
