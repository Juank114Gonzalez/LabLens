'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/errors';
import { routes } from '@/config/routes';
import {
  login,
  logout,
  register,
} from '@/features/auth/services/auth.service';
import type { LoginFormValues, RegisterFormValues } from '@/features/auth/types/auth.schema';
import { useAuthStore } from '@/stores/auth.store';

export function useAuth() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: (session) => {
      setSession(session);
      toast.success('Sesión iniciada');
      router.replace(routes.dashboard);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo iniciar sesión')),
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) => register(values),
    onSuccess: (session) => {
      setSession(session);
      toast.success('Cuenta creada');
      router.replace(routes.dashboard);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo registrar')),
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      clearSession();
      toast.message('Sesión cerrada');
      router.replace(routes.login);
    },
  });

  return {
    user,
    hydrated,
    isAuthenticated: Boolean(user),
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
