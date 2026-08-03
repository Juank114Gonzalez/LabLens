'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { routes } from '@/config/routes';
import { EmptyState } from '@/shared/components/empty-state';

export default function EvaluationsPage() {
  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Evaluaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Módulo preparado para el Gestor de Evaluación. En el siguiente incremento podrás
            seleccionar una iniciativa y conversar con LabLens.
          </p>
        </div>
        <EmptyState
          title="Flujo de evaluación próximamente"
          description="La navegación ya está lista. Aún no se inician conversaciones ni se calcula Fit."
          action={
            <Button asChild variant="outline">
              <Link href={routes.dashboard}>Volver al dashboard</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
