'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { conversationsQueryKey } from '@/features/conversation/hooks/use-conversations';
import { startEvaluation } from '@/features/conversation/services/conversation.service';
import { listInitiatives } from '@/features/initiative/services/initiative.service';
import { EmptyState } from '@/shared/components/empty-state';

export default function NewEvaluationChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>('');

  const initiativesQuery = useQuery({
    queryKey: ['initiatives', 'for-evaluation'],
    queryFn: listInitiatives,
  });

  const eligible = (initiativesQuery.data ?? []).filter(
    (item) => item.status !== 'DRAFT' && item.status !== 'ARCHIVED',
  );

  const startMutation = useMutation({
    mutationFn: () => startEvaluation(selectedId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
      toast.success('Evaluación iniciada');
      router.replace(routes.chat(result.conversationId));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'No se pudo iniciar la evaluación'));
    },
  });

  if (initiativesQuery.isLoading) {
    return (
      <div className="mx-auto flex h-full max-w-2xl flex-col gap-4 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (eligible.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="No hay iniciativas listas para evaluar"
          description="Las iniciativas deben estar registradas (no en borrador)."
          action={
            <Button asChild variant="outline">
              <Link href={routes.evaluations}>Volver</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Nueva evaluación</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecciona una iniciativa. Se creará una evaluación y conversación nuevas, con el
            primer mensaje del agente.
          </p>
        </div>

        <ul className="space-y-2">
          {eligible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  selectedId === item.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border/70 hover:bg-muted/40'
                }`}
              >
                <p className="font-medium">{item.nombre || 'Sin nombre'}</p>
                <p className="text-xs text-muted-foreground">
                  {item.status} · {item.areaProcesoImpactado || 'Sin área'}
                </p>
              </button>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          disabled={!selectedId || startMutation.isPending}
          onClick={() => startMutation.mutate()}
        >
          {startMutation.isPending ? 'Iniciando entrevista…' : 'Iniciar evaluación'}
        </Button>
      </div>
    </div>
  );
}
