'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import {
  deleteEvaluation,
  listEvaluations,
} from '@/features/evaluation/services/evaluation.service';
import { NewEvaluationDialog } from '@/features/evaluation/components/new-evaluation-dialog';
import { useConfirmDialog } from '@/shared/components/confirm-dialog';
import { EmptyState } from '@/shared/components/empty-state';
import { useAuthStore } from '@/stores/auth.store';

export default function EvaluationsPage() {
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role) === 'ADMIN';
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const query = useQuery({
    queryKey: ['evaluations'],
    queryFn: listEvaluations,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvaluation(id),
    onSuccess: () => {
      toast.success('Evaluación eliminada');
      void queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleDelete(id: string, nombre: string) {
    const ok = await confirm({
      title: 'Eliminar evaluación',
      description: `¿Eliminar la evaluación de "${nombre || 'Iniciativa'}"? Se borrará también su conversación.`,
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(id);
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold">Evaluaciones</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada evaluación es inmutable y tiene una conversación asociada.
              {isAdmin ? ' Como admin puedes eliminarlas.' : ''}
            </p>
          </div>
          <NewEvaluationDialog trigger={<Button type="button">Nueva evaluación</Button>} />
        </div>

        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !query.data?.length ? (
          <EmptyState
            title="Aún no hay evaluaciones"
            description="Selecciona una iniciativa registrada para iniciar la entrevista con el Lente de Innovación."
            action={
              <NewEvaluationDialog
                trigger={<Button type="button">Seleccionar iniciativa</Button>}
              />
            }
          />
        ) : (
          <ul className="space-y-2">
            {query.data.map((item) => {
              const href =
                item.status === 'COMPLETED'
                  ? routes.evaluation(item.id)
                  : item.conversation
                    ? routes.chat(item.conversation.id)
                    : routes.evaluation(item.id);

              return (
                <li
                  key={item.id}
                  className="flex items-stretch gap-2 rounded-xl border border-border/70 transition hover:bg-muted/40"
                >
                  <Link href={href} className="min-w-0 flex-1 px-4 py-3">
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
                  {isAdmin ? (
                    <div className="flex items-center pr-3">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() =>
                          void handleDelete(item.id, item.initiative.nombre)
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {confirmDialog}
      </div>
    </div>
  );
}
