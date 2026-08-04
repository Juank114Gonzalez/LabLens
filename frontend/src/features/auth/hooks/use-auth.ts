'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/errors';
import { routes } from '@/config/routes';
import { login, logout } from '@/features/auth/services/auth.service';
import { homeForRole } from '@/features/auth/lib/roles';
import type { LoginFormValues } from '@/features/auth/types/auth.schema';
import { useAuthStore } from '@/stores/auth.store';
import { useConversationMetaStore } from '@/stores/conversation-meta.store';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: (session) => {
      setSession(session);
      toast.success('Sesión iniciada');
      router.replace(homeForRole(session.user.role));
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo iniciar sesión')),
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      clearSession();
      useConversationMetaStore.getState().clear();
      queryClient.clear();
      toast.message('Sesión cerrada');
      router.replace(routes.login);
    },
  });

  return {
    user,
    hydrated,
    isAuthenticated: Boolean(user),
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
  };
}
