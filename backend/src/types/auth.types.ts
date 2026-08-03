import type { Role } from '@prisma/client';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthSessionResponse = {
  user: AuthUser & {
    avatarUrl: null;
  };
  tokens: {
    accessToken: string;
    expiresAt: number;
  };
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
  type: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  type: 'refresh';
  jti: string;
};
