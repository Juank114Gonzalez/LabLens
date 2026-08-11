'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/errors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { routes } from '@/config/routes';
import { conversationsQueryKey } from '@/features/conversation/hooks/use-conversations';
import { startEvaluation } from '@/features/conversation/services/conversation.service';
import { InitiativeFiltersBar } from '@/features/initiative/components/initiative-filters';
import {
  listInitiatives,
  type InitiativeFilters,
} from '@/features/initiative/services/initiative.service';
import { EmptyState } from '@/shared/components/empty-state';
import { ScrollablePage } from '@/shared/components/scrollable-page';
import { formatShortDate } from '@/shared/lib/dates';

export default function LabInboxPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<InitiativeFilters>({});

  const query = useQuery({
    queryKey: ['initiatives', { ...filters, status: ['TRIAGED_LAB'] }],
    queryFn: () => listInitiatives({ ...filters, status: ['TRIAGED_LAB'] }),
  });

  // The heavy pipeline is unchanged — only its entry point moved to the inbox.
  const startMutation = useMutation({
    mutationFn: ({
      initiativeId,
      mode,
    }: {
      initiativeId: string;
      mode: 'interview' | 'direct';
    }) => startEvaluation(initiativeId, mode),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
      await queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      await queryClient.invalidateQueries({ queryKey: ['initiatives'] });

      if (result.mode === 'direct' && result.evaluation?.id) {
        toast.success('Evaluación generada');
        router.push(routes.evaluation(result.evaluation.id));
        return;
      }

      toast.success('Entrevista iniciada');
      router.push(routes.chat(result.conversationId));
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'No se pudo iniciar la evaluación')),
  });

  const items = query.data ?? [];

  return (
    <ScrollablePage
      className="p-6 sm:p-8"
      contentClassName="max-w-6xl flex flex-col gap-6"
    >
      <div>
        <h1 className="font-heading text-3xl font-semibold">Bandeja del Lab</h1>
        <p className="text-muted-foreground text-sm">
          Iniciativas disruptivas o adyacentes que el triage dejó en el Laboratorio y
          esperan una evaluación completa.
        </p>
      </div>

      <InitiativeFiltersBar value={filters} onChange={setFilters} showStatus={false} />

      {query.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Bandeja vacía"
          description="Ninguna iniciativa espera evaluación con estos filtros."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Clasificación</TableHead>
              <TableHead>Confianza</TableHead>
              <TableHead>Triage</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.nombre || 'Sin nombre'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {item.triageClassification?.nombre ?? 'Sin clasificar'}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">
                  {item.triageConfidence !== null
                    ? `${Math.round(item.triageConfidence * 100)}%`
                    : '—'}
                </TableCell>
                <TableCell>
                  {item.triagedAt ? formatShortDate(item.triagedAt) : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={routes.initiative(item.id)}>Ver detalle</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={startMutation.isPending}
                      onClick={() =>
                        startMutation.mutate({ initiativeId: item.id, mode: 'interview' })
                      }
                    >
                      Entrevistar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={startMutation.isPending}
                      onClick={() =>
                        startMutation.mutate({ initiativeId: item.id, mode: 'direct' })
                      }
                    >
                      Evaluar ahora
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ScrollablePage>
  );
}
