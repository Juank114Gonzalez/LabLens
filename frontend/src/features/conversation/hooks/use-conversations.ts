'use client';

import { useQuery } from '@tanstack/react-query';
import { canAccessChat } from '@/features/auth/lib/roles';
import { listConversations } from '@/features/conversation/services/conversation.service';
import { useAuthStore } from '@/stores/auth.store';

export const conversationsQueryKey = ['conversations'] as const;

export function useConversations() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const role = useAuthStore((state) => state.user?.role);
  const enabled = hydrated && Boolean(accessToken) && Boolean(role && canAccessChat(role));

  return useQuery({
    queryKey: conversationsQueryKey,
    queryFn: listConversations,
    enabled,
  });
}
