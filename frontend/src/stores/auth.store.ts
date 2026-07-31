'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession, AuthUser } from '@/types/auth';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  expiresAt: number | null;
  hydrated: boolean;
  setSession: (session: AuthSession) => void;
  setAccessToken: (token: string, expiresAt: number) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      expiresAt: null,
      hydrated: false,
      setSession: (session) =>
        set({
          user: session.user,
          accessToken: session.tokens.accessToken,
          expiresAt: session.tokens.expiresAt,
        }),
      setAccessToken: (token, expiresAt) =>
        set({ accessToken: token, expiresAt }),
      clearSession: () =>
        set({ user: null, accessToken: null, expiresAt: null }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: 'lablens-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        expiresAt: state.expiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
