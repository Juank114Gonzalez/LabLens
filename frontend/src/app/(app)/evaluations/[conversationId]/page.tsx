'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { getConversation } from '@/features/conversation/services/conversation.service';
import {
  deleteEvaluation,
  getEvaluation,
} from '@/features/evaluation/services/evaluation.service';
import { EvaluationResultPanel } from '@/features/evaluation/components/evaluation-result-panel';
import { useConfirmDialog } from '@/shared/components/confirm-dialog';
import { EmptyState } from '@/shared/components/empty-state';
import { useAuthStore } from '@/stores/auth.store';

type EvaluationDetailPageProps = {
  params: Promise<{ conversationId: string }>;
};

/**
 * Supports both /evaluations/:evaluationId and legacy conversationId routes.
 */
export default function EvaluationDetailPage({ params }: EvaluationDetailPageProps) {
  const { conversationId: id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role) === 'ADMIN';
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const byEvaluation = useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => getEvaluation(id),
    retry: false,
  });

  const byConversation = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversation(id),
    enabled: byEvaluation.isError,
    retry: false,
  });

  const evaluation = byEvaluation.data ?? byConversation.data?.evaluation ?? null;
  const isLoading =
    byEvaluation.isLoading || (byEvaluation.isError && byConversation.isLoading);

  const deleteMutation = useMutation({
    mutationFn: (evaluationId: string) => deleteEvaluation(evaluationId),
    onSuccess: () => {
      toast.success('Evaluación eliminada');
      void queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      router.replace(routes.evaluations);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="ghost" className="-ml-2">
            <Link href={routes.evaluations}>
              <ArrowLeft className="size-4" />
              Volver
            </Link>
          </Button>
          {isAdmin && evaluation?.id ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => {
                void confirm({
                  title: 'Eliminar evaluación',
                  description: '¿Eliminar esta evaluación? Se borrará también su conversación.',
                  confirmLabel: 'Eliminar',
                  variant: 'destructive',
                }).then((ok) => {
                  if (ok) deleteMutation.mutate(evaluation.id);
                });
              }}
            >
              <Trash2 className="size-3.5" />
              Eliminar evaluación
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : evaluation ? (
          <>
            <div>
              <h1 className="font-heading text-3xl font-semibold">
                {evaluation.initiative?.nombre || 'Evaluación'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Resultado profesional · configuración {evaluation.configVersion ?? 'n/d'}
              </p>
            </div>
            <EvaluationResultPanel evaluation={evaluation} />
          </>
        ) : (
          <EmptyState
            title="Esta evaluación aún no tiene resultados"
            description="Continúa la entrevista hasta que el Lente de Innovación indique que está lista para evaluar."
            action={
              <Button asChild>
                <Link href={routes.chat(id)}>Ir a la conversación</Link>
              </Button>
            }
          />
        )}
        {confirmDialog}
      </div>
    </div>
  );
}
