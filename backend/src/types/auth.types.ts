export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthSessionResponse = {
  user: AuthUser & {
    role: 'innovator';
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
  type: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  type: 'refresh';
  jti: string;
};
