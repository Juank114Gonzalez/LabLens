'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { routes } from '@/config/routes';
import { canAccessChat } from '@/features/auth/lib/roles';
import { useConversations } from '@/features/conversation/hooks/use-conversations';
import { EmptyState } from '@/shared/components/empty-state';
import { formatShortDate } from '@/shared/lib/dates';
import { useAuthStore } from '@/stores/auth.store';

export default function EvaluationsPage() {
  const user = useAuthStore((state) => state.user);
  const canChat = Boolean(user && canAccessChat(user.role));
  const { data: items = [] } = useConversations();
  const completed = items.filter((item) => item.status === 'COMPLETED');

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Evaluaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resultados completos generados por el Comité Virtual.
          </p>
        </div>

        {completed.length === 0 ? (
          <EmptyState
            title="Sin evaluaciones todavía"
            description="Completa una entrevista con LabLens para generar la ficha de evaluación."
            action={
              canChat ? (
                <Button asChild>
                  <Link href={routes.chatNew}>Nueva evaluación</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {completed.map((item) => (
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
