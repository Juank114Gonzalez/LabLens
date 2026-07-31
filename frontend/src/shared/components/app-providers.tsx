'use client';

import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureApiClient } from '@/api/client';
import { refreshSession } from '@/features/auth/services/auth.service';
import { createQueryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeProvider } from './theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => useAuthStore.getState().accessToken,
      refreshAccessToken: async () => {
        const token = await refreshSession();
        if (token) {
          setAccessToken(token, Date.now() + 1000 * 60 * 60);
        }
        return token;
      },
      onUnauthorized: () => {
        clearSession();
      },
    });
  }, [accessToken, clearSession, setAccessToken]);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
