'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { InitiativeFormWizard } from '@/features/initiative/components/initiative-form-wizard';
import { getInitiative } from '@/features/initiative/services/initiative.service';
import { EmptyState } from '@/shared/components/empty-state';

type Props = { params: Promise<{ id: string }> };

export default function EditInitiativePage({ params }: Props) {
  const { id } = use(params);
  const query = useQuery({
    queryKey: ['initiative', id],
    queryFn: () => getInitiative(id),
  });

  if (query.isLoading) {
    return (
      <div className="h-full min-h-0 overflow-y-auto p-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto p-8">
        <EmptyState title="Iniciativa no encontrada" description="Verifica el enlace." />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <InitiativeFormWizard initiative={query.data} />
    </div>
  );
}
