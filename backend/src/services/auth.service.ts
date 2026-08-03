import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import {
  createUser,
  findUserByEmail,
  findUserById,
} from '../repositories/user.repository.js';
import type { AuthSessionResponse, AuthUser } from '../types/auth.types.js';
import { AppError } from '../utils/AppError.js';
import {
  clearRefreshCookie,
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  setRefreshCookie,
  signAccessToken,
} from './token.service.js';

const BCRYPT_ROUNDS = 10;

function toAuthUser(user: { id: string; name: string; email: string }): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function toSession(user: AuthUser, accessToken: string, expiresAt: number): AuthSessionResponse {
  return {
    user: {
      ...user,
      role: 'innovator',
      avatarUrl: null,
    },
    tokens: {
      accessToken,
      expiresAt,
    },
  };
}

async function createSession(user: AuthUser, res: Response): Promise<AuthSessionResponse> {
  const { token, expiresAt } = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id);
  setRefreshCookie(res, refreshToken);
  return toSession(user, token, expiresAt);
}

export async function registerUser(
  input: { name: string; email: string; password: string },
  res: Response,
): Promise<AuthSessionResponse> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await createUser({
    name: input.name.trim(),
    email: input.email,
    passwordHash,
  });

  return createSession(toAuthUser(user), res);
}

export async function loginUser(
  input: { email: string; password: string },
  res: Response,
): Promise<AuthSessionResponse> {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }

  return createSession(toAuthUser(user), res);
}

export async function logoutUser(
  refreshToken: string | undefined,
  res: Response,
): Promise<void> {
  await revokeRefreshToken(refreshToken);
  clearRefreshCookie(res);
}

export async function refreshSession(
  refreshToken: string | undefined,
  res: Response,
): Promise<{ accessToken: string; expiresAt: number }> {
  if (!refreshToken) {
    throw new AppError('Refresh token missing', 401);
  }

  const { userId, nextToken } = await rotateRefreshToken(refreshToken);
  const user = await findUserById(userId);

  if (!user) {
    clearRefreshCookie(res);
    throw new AppError('User not found', 401);
  }

  setRefreshCookie(res, nextToken);
  const { token, expiresAt } = signAccessToken(toAuthUser(user));
  return { accessToken: token, expiresAt };
}

export async function getCurrentUser(userId: string): Promise<AuthSessionResponse['user']> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    ...toAuthUser(user),
    role: 'innovator',
    avatarUrl: null,
  };
}
