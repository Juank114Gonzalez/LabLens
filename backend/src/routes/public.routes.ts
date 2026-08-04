import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { submitPublicInitiativeController } from '../controllers/public-initiative.controller.js';
import {
  parsePublicInitiativeBody,
  parsePublicSubmissionUpload,
} from '../middlewares/public-submission.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicInitiativeSchema } from '../validators/public-initiative.validator.js';

const publicRouter = Router();

// The submission endpoint is unauthenticated and triggers an LLM call per request,
// so it is the one surface that needs a hard ceiling per origin.
const submissionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.PUBLIC_SUBMISSION_RATE_LIMIT,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas iniciativas enviadas desde esta conexión. Intenta de nuevo más tarde.',
  },
});

publicRouter.post(
  '/initiatives',
  submissionRateLimit,
  parsePublicSubmissionUpload,
  parsePublicInitiativeBody,
  validateRequest(publicInitiativeSchema),
  asyncHandler(submitPublicInitiativeController),
);

export { publicRouter };
