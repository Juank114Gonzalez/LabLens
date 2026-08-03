'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { listEvaluations } from '@/features/evaluation/services/evaluation.service';
import { EmptyState } from '@/shared/components/empty-state';

export default function EvaluationsPage() {
  const query = useQuery({
    queryKey: ['evaluations'],
    queryFn: listEvaluations,
  });

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold">Evaluaciones</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada evaluación es inmutable y tiene una conversación asociada.
            </p>
          </div>
          <Button asChild>
            <Link href={routes.chatNew}>Nueva evaluación</Link>
          </Button>
        </div>

        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !query.data?.length ? (
          <EmptyState
            title="Aún no hay evaluaciones"
            description="Selecciona una iniciativa registrada para iniciar la entrevista con LabLens."
            action={
              <Button asChild>
                <Link href={routes.chatNew}>Seleccionar iniciativa</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {query.data.map((item) => (
              <li key={item.id}>
                <Link
                  href={
                    item.status === 'COMPLETED'
                      ? routes.evaluation(item.id)
                      : item.conversation
                        ? routes.chat(item.conversation.id)
                        : routes.evaluation(item.id)
                  }
                  className="block rounded-xl border border-border/70 px-4 py-3 transition hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.initiative.nombre || 'Iniciativa'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.status}
                        {item.readinessStatus ? ` · ${item.readinessStatus}` : ''}
                        {item.evaluator ? ` · ${item.evaluator.name}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.updatedAt ?? item.createdAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
