'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/errors';
import { routes } from '@/config/routes';
import { createConversation } from '@/features/conversation/services/conversation.service';
import {
  createListItemFromConversation,
  useConversationMetaStore,
} from '@/stores/conversation-meta.store';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewChatPage() {
  const router = useRouter();
  const upsert = useConversationMetaStore((state) => state.upsert);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        const conversation = await createConversation();
        upsert(
          createListItemFromConversation({
            id: conversation.id,
            title: conversation.initiativeData.title ?? undefined,
            status: conversation.status,
            completion: conversation.completion,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
          }),
        );
        router.replace(routes.chat(conversation.id));
      } catch (error) {
        toast.error(getErrorMessage(error, 'No se pudo crear la conversación'));
        router.replace(routes.dashboard);
      }
    })();
  }, [router, upsert]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-24 w-full max-w-xl" />
      <p className="text-sm text-muted-foreground">Preparando nueva iniciativa…</p>
    </div>
  );
}
