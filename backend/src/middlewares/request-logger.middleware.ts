import type { NextFunction, Request, Response } from 'express';

const HEALTH_PATH = '/api/health';

function pickLogger(statusCode: number): typeof console.log {
  if (statusCode >= 500) {
    return console.error;
  }
  if (statusCode >= 400) {
    return console.warn;
  }
  return console.log;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    const path = req.originalUrl.split('?')[0];
    if (req.method === 'GET' && path === HEALTH_PATH) {
      return;
    }

    const durationMs = Date.now() - startedAt;
    const ip = req.ip ?? '-';
    const userId = req.user?.id ? ` u=${req.user.id}` : '';
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms ${ip}${userId}`;

    pickLogger(res.statusCode)(line);
  });

  next();
}
