import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10,
  },
});

const multipartParser = upload.array('files', 10);

/**
 * Only parse multipart when the client actually sent files; JSON submissions
 * keep using express.json without Multer touching the body.
 */
export function parsePublicSubmissionUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('multipart/form-data')) {
    next();
    return;
  }
  multipartParser(req, res, next);
}

/**
 * Multipart sends `payload` as a JSON string (+ `files`). Normalize to the
 * object shape that validateRequest expects.
 */
export function parsePublicInitiativeBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (typeof req.body?.payload === 'string') {
      const parsed = JSON.parse(req.body.payload) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new AppError('payload inválido', 400);
      }
      req.body = parsed;
      next();
      return;
    }

    if (typeof req.body?.companyContacts === 'string') {
      req.body.companyContacts = JSON.parse(req.body.companyContacts);
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError('No se pudo leer el cuerpo de la solicitud', 400));
  }
}
