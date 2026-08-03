'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/errors';
import { routes } from '@/config/routes';
import {
  generateEvaluation,
  getConversation,
} from '@/features/conversation/services/conversation.service';
import { conversationsQueryKey } from '@/features/conversation/hooks/use-conversations';
import { EvaluationResultPanel } from '@/features/evaluation/components/evaluation-result-panel';
import { EvaluationStatusPanel } from '@/features/evaluation/components/evaluation-status-panel';
import { Skeleton } from '@/components/ui/skeleton';

type RightInsightPanelProps = {
  conversationId?: string;
};

export function RightInsightPanel({ conversationId }: RightInsightPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: Boolean(conversationId),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateEvaluation(conversationId!),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      void queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
      toast.success('Evaluación generada');
      if (result.evaluation?.id) {
        router.push(routes.evaluation(result.evaluation.id));
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'No se pudo generar la evaluación'));
    },
  });

  if (conversationId && query.isLoading) {
    return (
      <aside className="flex h-full flex-col border-l border-border/70 p-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="mt-3 h-40 w-full" />
      </aside>
    );
  }

  if (query.data?.status === 'COMPLETED' && query.data.evaluation) {
    return (
      <aside className="flex h-full min-h-0 w-full flex-col border-l border-border/70 bg-sidebar/40">
        <div className="border-b border-border/70 px-4 py-3">
          <p className="font-heading text-sm font-medium">Resultado</p>
          <p className="text-xs text-muted-foreground">Evaluación inmutable</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <EvaluationResultPanel evaluation={query.data.evaluation} />
        </div>
      </aside>
    );
  }

  return (
    <EvaluationStatusPanel
      conversation={query.data}
      isLoading={Boolean(conversationId) && query.isLoading}
      onGenerate={() => generateMutation.mutate()}
      isGenerating={generateMutation.isPending}
    />
  );
}
