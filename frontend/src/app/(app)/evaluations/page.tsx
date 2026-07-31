'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { routes } from '@/config/routes';
import { EmptyState } from '@/shared/components/empty-state';
import { formatShortDate } from '@/shared/lib/dates';
import { useConversationMetaStore } from '@/stores/conversation-meta.store';

export default function EvaluationsPage() {
  const items = useConversationMetaStore((state) => state.items).filter(
    (item) => item.status === 'COMPLETED',
  );

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Evaluaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resultados completos generados por el Comité Virtual.
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Sin evaluaciones todavía"
            description="Completa una entrevista con LabLens para generar la ficha de evaluación."
            action={
              <Button asChild>
                <Link href={routes.chatNew}>Nueva iniciativa</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={routes.evaluation(item.id)}
                className="block rounded-2xl border border-border/70 bg-card/60 px-4 py-4 transition-colors hover:bg-accent/30"
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatShortDate(item.updatedAt)} · Completitud {item.completion}%
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
