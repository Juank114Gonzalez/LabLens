import { apiClient } from '@/api/client';
import type { AuthSession, AuthUser, LoginPayload } from '@/types/auth';

type RefreshResponse = {
  accessToken: string;
  expiresAt: number;
};

export async function login(payload: LoginPayload): Promise<AuthSession> {
  return apiClient.post<AuthSession>('/api/auth/login', payload, { auth: false });
}

export async function loginWithMicrosoft(accessToken: string): Promise<AuthSession> {
  return apiClient.post<AuthSession>('/api/auth/microsoft', { accessToken }, { auth: false });
}


export async function refreshSession(): Promise<RefreshResponse | null> {
  try {
    return await apiClient.post<RefreshResponse>(
      '/api/auth/refresh',
      undefined,
      { auth: false, skipRefresh: true, retry: 0 },
    );
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout', undefined, {
      auth: false,
      skipRefresh: true,
      retry: 0,
    });
  } catch {
    // Clear local session even if the API call fails.
  }
}

export async function getMe(): Promise<AuthUser> {
  return apiClient.get<AuthUser>('/api/auth/me');
}
