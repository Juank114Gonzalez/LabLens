'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { getConversation } from '@/features/conversation/services/conversation.service';
import { EvaluationResultPanel } from '@/features/evaluation/components/evaluation-result-panel';
import { EmptyState } from '@/shared/components/empty-state';

type EvaluationDetailPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default function EvaluationDetailPage({ params }: EvaluationDetailPageProps) {
  const { conversationId } = use(params);
  const query = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
  });

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Button asChild variant="ghost" className="-ml-2">
          <Link href={routes.evaluations}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>

        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : query.data?.evaluation ? (
          <>
            <div>
              <h1 className="font-heading text-3xl font-semibold">
                {query.data.title || query.data.initiativeData?.title || 'Evaluación'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ficha completa del Comité Virtual
              </p>
            </div>
            <EvaluationResultPanel evaluation={query.data.evaluation} />
          </>
        ) : (
          <EmptyState
            title="Esta conversación aún no tiene evaluación"
            description="Continúa la entrevista hasta alcanzar el umbral de completitud."
            action={
              <Button asChild>
                <Link href={routes.chat(conversationId)}>Ir a la conversación</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
