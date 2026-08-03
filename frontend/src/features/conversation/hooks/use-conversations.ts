'use client';

import { useQuery } from '@tanstack/react-query';
import { listConversations } from '@/features/conversation/services/conversation.service';
import { useAuthStore } from '@/stores/auth.store';

export const conversationsQueryKey = ['conversations'] as const;

export function useConversations() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  return useQuery({
    queryKey: conversationsQueryKey,
    queryFn: listConversations,
    enabled: hydrated && Boolean(accessToken),
  });
}
