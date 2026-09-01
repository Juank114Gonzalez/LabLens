import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { isOriginAllowed } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';
import { apiRouter } from './routes/index.js';
import { AppError } from './utils/AppError.js';

export function createApp() {
  const app = express();

  // Render/Vercel put a single proxy in front of the app; without this the rate
  // limiter would bucket every public submission under the proxy's IP.
  app.set('trust proxy', 1);

  // credentials: 'include' from the frontend forbids Access-Control-Allow-Origin: *,
  // so the allowed origin is echoed per request instead of hardcoded.
  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin requests and curl send no Origin header at all.
        if (!origin || isOriginAllowed(origin)) {
          callback(null, true);
          return;
        }
        callback(new AppError(`Origen no permitido por CORS: ${origin}`, 403));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
