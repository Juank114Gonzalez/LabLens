export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'innovator' | 'reviewer' | 'admin';
  avatarUrl?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  /** Refresh token is expected as HttpOnly cookie from backend. */
  expiresAt: number;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};
