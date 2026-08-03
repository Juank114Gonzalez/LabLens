import { createHash, randomUUID } from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  createRefreshToken,
  findValidRefreshTokenByHash,
  revokeRefreshTokenByHash,
} from '../repositories/refresh-token.repository.js';
import type {
  AccessTokenPayload,
  AuthUser,
  RefreshTokenPayload,
} from '../types/auth.types.js';
import { durationToMs } from '../utils/duration.js';
import { AppError } from '../utils/AppError.js';

export const REFRESH_COOKIE_NAME = 'lablens_refresh';

function refreshCookieOptions(): CookieOptions {
  const secure = env.COOKIE_SECURE || env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: durationToMs(env.JWT_REFRESH_EXPIRES),
  };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(user: AuthUser): { token: string; expiresAt: number } {
  const expiresInMs = durationToMs(env.JWT_ACCESS_EXPIRES);
  const expiresAt = Date.now() + expiresInMs;
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    type: 'access',
  };

  const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
  });

  return { token, expiresAt };
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const jti = randomUUID();
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: 'refresh',
    jti,
  };

  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
  });

  await createRefreshToken({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES)),
  });

  return token;
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...refreshCookieOptions(),
    maxAge: 0,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (payload.type !== 'access' || !payload.sub) {
      throw new AppError('Invalid access token', 401);
    }
    return payload;
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }
}

export async function rotateRefreshToken(
  rawToken: string,
): Promise<{ userId: string; nextToken: string }> {
  let payload: RefreshTokenPayload;

  try {
    payload = jwt.verify(rawToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (payload.type !== 'refresh' || !payload.sub) {
    throw new AppError('Invalid refresh token', 401);
  }

  const tokenHash = hashToken(rawToken);
  const stored = await findValidRefreshTokenByHash(tokenHash);

  if (!stored || stored.userId !== payload.sub) {
    throw new AppError('Refresh token revoked or unknown', 401);
  }

  await revokeRefreshTokenByHash(tokenHash);
  const nextToken = await issueRefreshToken(payload.sub);

  return { userId: payload.sub, nextToken };
}

export async function revokeRefreshToken(rawToken: string | undefined): Promise<void> {
  if (!rawToken) {
    return;
  }

  await revokeRefreshTokenByHash(hashToken(rawToken));
}
