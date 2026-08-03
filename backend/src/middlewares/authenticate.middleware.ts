import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../services/token.service.js';
import { AppError } from '../utils/AppError.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch (error) {
    next(error);
  }
}
