'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/errors';
import { routes } from '@/config/routes';
import { createConversation } from '@/features/conversation/services/conversation.service';
import { conversationsQueryKey } from '@/features/conversation/hooks/use-conversations';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        const conversation = await createConversation();
        await queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
        router.replace(routes.chat(conversation.id));
      } catch (error) {
        toast.error(getErrorMessage(error, 'No se pudo crear la conversación'));
        router.replace(routes.dashboard);
      }
    })();
  }, [queryClient, router]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-24 w-full max-w-xl" />
      <p className="text-sm text-muted-foreground">Preparando nueva iniciativa…</p>
    </div>
  );
}
