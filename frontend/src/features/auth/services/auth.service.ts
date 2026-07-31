import { apiClient } from '@/api/client';
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
} from '@/types/auth';

/**
 * Auth service.
 *
 * TODO(backend): POST /api/auth/login
 * TODO(backend): POST /api/auth/register
 * TODO(backend): POST /api/auth/refresh  (refresh token via HttpOnly cookie)
 * TODO(backend): POST /api/auth/logout
 * TODO(backend): GET  /api/auth/me
 *
 * Until those endpoints exist, this service uses a local mock session so the
 * protected UX (login → dashboard → chat) can be developed end-to-end.
 */

const MOCK_PASSWORD_MIN = 6;

function mockSession(name: string, email: string): AuthSession {
  const now = Date.now();
  return {
    user: {
      id: crypto.randomUUID(),
      name,
      email,
      role: 'innovator',
      avatarUrl: null,
    },
    tokens: {
      accessToken: `mock-access-${crypto.randomUUID()}`,
      expiresAt: now + 1000 * 60 * 60,
    },
  };
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  // TODO(backend): return apiClient.post<AuthSession>('/api/auth/login', payload, { auth: false });
  await delay(450);

  if (!payload.email.includes('@') || payload.password.length < MOCK_PASSWORD_MIN) {
    throw new Error('Credenciales inválidas');
  }

  const name = payload.email.split('@')[0] ?? 'Innovador';
  return mockSession(capitalize(name), payload.email.toLowerCase());
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  // TODO(backend): return apiClient.post<AuthSession>('/api/auth/register', payload, { auth: false });
  await delay(550);

  if (payload.password.length < MOCK_PASSWORD_MIN) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  return mockSession(payload.name.trim(), payload.email.toLowerCase());
}

export async function refreshSession(): Promise<string | null> {
  // TODO(backend): call POST /api/auth/refresh with credentials: 'include'
  // Refresh token should be HttpOnly; frontend only receives a new access token.
  void apiClient;
  await delay(120);
  return `mock-access-${crypto.randomUUID()}`;
}

export async function logout(): Promise<void> {
  // TODO(backend): await apiClient.post('/api/auth/logout');
  await delay(120);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function capitalize(value: string) {
  if (!value) return 'Innovador';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
