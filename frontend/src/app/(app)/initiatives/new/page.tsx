'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { InitiativeFormWizard } from '@/features/initiative/components/initiative-form-wizard';
import { createDraft } from '@/features/initiative/services/initiative.service';
import type { DomainInitiative } from '@/features/initiative/types';

export default function NewInitiativePage() {
  const router = useRouter();
  const started = useRef(false);
  const [initiative, setInitiative] = useState<DomainInitiative | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void createDraft()
      .then((created) => {
        setInitiative(created);
        router.replace(routes.initiativeEdit(created.id));
      })
      .catch((error: Error) => {
        toast.error(error.message || 'No se pudo crear el borrador');
        router.replace(routes.initiatives);
      });
  }, [router]);

  if (!initiative) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
        <Skeleton className="h-8 w-56" />
        <p className="text-sm text-muted-foreground">Creando borrador…</p>
      </div>
    );
  }

  return <InitiativeFormWizard initiative={initiative} />;
}
