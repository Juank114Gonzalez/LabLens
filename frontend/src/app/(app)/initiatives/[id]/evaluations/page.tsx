'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { EvaluationsTable } from '@/features/initiative/components/evaluations-table';
import {
  getInitiative,
  listInitiativeEvaluations,
} from '@/features/initiative/services/initiative.service';

type Props = { params: Promise<{ id: string }> };

export default function InitiativeEvaluationsPage({ params }: Props) {
  const { id } = use(params);
  const initiativeQuery = useQuery({
    queryKey: ['initiative', id],
    queryFn: () => getInitiative(id),
  });
  const evaluationsQuery = useQuery({
    queryKey: ['initiative-evaluations', id],
    queryFn: () => listInitiativeEvaluations(id),
  });

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-6 overflow-y-auto p-6 sm:p-8">
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
        <EvaluationsTable items={evaluationsQuery.data ?? []} />
      )}
    </div>
  );
}
