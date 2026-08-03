'use client';

import { PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConversationView } from '@/types/conversation';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

type EvaluationStatusPanelProps = {
  conversation?: ConversationView;
  isLoading?: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
};

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec.toString().padStart(2, '0')}s`;
}

function readinessTone(status: string) {
  if (status === 'READY') return 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30';
  if (status === 'IN_PROGRESS') return 'text-amber-700 bg-amber-500/10 border-amber-500/30';
  return 'text-slate-600 bg-slate-500/10 border-slate-500/30';
}

export function EvaluationStatusPanel({
  conversation,
  isLoading,
  onGenerate,
  isGenerating,
}: EvaluationStatusPanelProps) {
  const setRightPanelOpen = useUiStore((state) => state.setRightPanelOpen);
  const canGenerate =
    Boolean(conversation) &&
    conversation?.status !== 'COMPLETED' &&
    (conversation?.canGenerate ?? true);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-border/70 bg-sidebar/40">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p className="font-heading text-sm font-medium">Estado de Evaluación</p>
          <p className="text-xs text-muted-foreground">Modo entrevista · sin juicios</p>
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

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : !conversation ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
            Selecciona una iniciativa para iniciar una entrevista o evaluación directa.
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Iniciativa</p>
              <p className="font-heading text-base font-medium">
                {conversation.initiative?.nombre || conversation.title || 'Sin nombre'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado</p>
              <p className="text-sm">{conversation.status.replaceAll('_', ' ')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Tiempo</p>
                <p className="font-medium">{formatDuration(conversation.elapsedMs)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mensajes</p>
                <p className="font-medium">{conversation.messageCount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Preparación</p>
              <div
                className={cn(
                  'rounded-xl border px-3 py-3 text-sm font-medium',
                  readinessTone(conversation.readinessStatus),
                )}
              >
                {conversation.readinessLabel}
              </div>
              <p className="text-xs text-muted-foreground">
                Señal orientativa. Puedes generar la evaluación cuando quieras.
              </p>
            </div>

            {canGenerate ? (
              <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
                {conversation.readinessStatus === 'READY' ? (
                  <p className="text-sm leading-relaxed">
                    Considero que tengo suficiente información. ¿Deseas generar la evaluación?
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed">
                    Puedes generar la evaluación ahora con la información disponible, o continuar
                    la entrevista para enriquecerla.
                  </p>
                )}
                <Button
                  type="button"
                  className="w-full"
                  onClick={onGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Ejecutando pipeline…' : 'Generar evaluación'}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
