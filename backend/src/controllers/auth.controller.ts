import type { Request, Response } from 'express';
import {
  getCurrentUser,
  loginUser,
  loginWithMicrosoft,
  logoutUser,
  refreshSession,
} from '../services/auth.service.js';
import { REFRESH_COOKIE_NAME } from '../services/token.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import type { LoginDto, MicrosoftLoginDto } from '../validators/auth.validator.js';

function getRefreshCookie(req: Request): string | undefined {
  const value = req.cookies?.[REFRESH_COOKIE_NAME];
  return typeof value === 'string' ? value : undefined;
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginDto;
  const session = await loginUser(body, res);
  sendSuccess(res, session);
}

export async function microsoftLoginController(req: Request, res: Response): Promise<void> {
  const body = req.body as MicrosoftLoginDto;
  const session = await loginWithMicrosoft(body.accessToken, res);
  sendSuccess(res, session);
}

export async function logoutController(req: Request, res: Response): Promise<void> {
  await logoutUser(getRefreshCookie(req), res);
  sendSuccess(res, { ok: true });
}

export async function refreshController(req: Request, res: Response): Promise<void> {
  const tokens = await refreshSession(getRefreshCookie(req), res);
  sendSuccess(res, tokens);
}

export async function meController(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const user = await getCurrentUser(req.user.id);
  sendSuccess(res, user);
}

