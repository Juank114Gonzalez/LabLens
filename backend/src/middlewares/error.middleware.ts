import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import type { ApiErrorResponse } from '../types/api.types.js';
import { AppError } from '../utils/AppError.js';

function buildErrorBody(message: string): ApiErrorResponse {
  return {
    success: false,
    message,
  };
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(buildErrorBody('Route not found'));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join('; ');
    console.warn(`[Validation] ${message || 'Validation error'}`);
    res.status(400).json(buildErrorBody(message || 'Validation error'));
    return;
  }

  if (err instanceof AppError) {
    const log = err.statusCode >= 500 ? console.error : console.warn;
    log(`[AppError ${err.statusCode}] ${err.message}`);
    res.status(err.statusCode).json(buildErrorBody(err.message));
    return;
  }

  if (env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error(`[Unhandled] ${message}`);
  }

  const message =
    err instanceof Error && env.NODE_ENV !== 'production'
      ? err.message
      : 'Internal server error';

  res.status(500).json(buildErrorBody(message));
}
