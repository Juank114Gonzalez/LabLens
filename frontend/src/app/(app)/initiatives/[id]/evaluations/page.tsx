'use client';

import { use } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { EvaluationsTable } from '@/features/initiative/components/evaluations-table';
import { deleteEvaluation } from '@/features/evaluation/services/evaluation.service';
import {
  getInitiative,
  listInitiativeEvaluations,
} from '@/features/initiative/services/initiative.service';
import { useConfirmDialog } from '@/shared/components/confirm-dialog';
import { useAuthStore } from '@/stores/auth.store';

type Props = { params: Promise<{ id: string }> };

export default function InitiativeEvaluationsPage({ params }: Props) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role) === 'ADMIN';
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const initiativeQuery = useQuery({
    queryKey: ['initiative', id],
    queryFn: () => getInitiative(id),
  });
  const evaluationsQuery = useQuery({
    queryKey: ['initiative-evaluations', id],
    queryFn: () => listInitiativeEvaluations(id),
  });

  const deleteMutation = useMutation({
    mutationFn: (evaluationId: string) => deleteEvaluation(evaluationId),
    onSuccess: () => {
      toast.success('Evaluación eliminada');
      void queryClient.invalidateQueries({ queryKey: ['initiative-evaluations', id] });
      void queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      void queryClient.invalidateQueries({ queryKey: ['initiative', id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleDelete(evaluationId: string) {
    const ok = await confirm({
      title: 'Eliminar evaluación',
      description: '¿Eliminar esta evaluación? Se borrará también su conversación.',
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(evaluationId);
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold">Historial de evaluaciones</h1>
            <p className="text-sm text-muted-foreground">
              {initiativeQuery.data?.nombre || 'Iniciativa'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={routes.initiative(id)}>Volver al detalle</Link>
          </Button>
        </div>
        {evaluationsQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <EvaluationsTable
            items={evaluationsQuery.data ?? []}
            canDelete={isAdmin}
            isDeleting={deleteMutation.isPending}
            onDelete={(evaluationId) => void handleDelete(evaluationId)}
          />
        )}
        {confirmDialog}
      </div>
    </div>
  );
}
