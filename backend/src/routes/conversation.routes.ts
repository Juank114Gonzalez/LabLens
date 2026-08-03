import { Role } from '@prisma/client';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Conversation endpoints are kept for frontend compatibility.
 * Evaluation/chat flow is prepared in the schema but not implemented in this increment.
 */
const conversationRouter = Router();

conversationRouter.use(authenticate, authorize(Role.EVALUATOR, Role.ADMIN));

conversationRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, []);
  }),
);

conversationRouter.post(
  '/',
  asyncHandler(async () => {
    throw new AppError(
      'Evaluation conversations are not available in this increment',
      501,
    );
  }),
);

conversationRouter.get(
  '/:id',
  asyncHandler(async () => {
    throw new AppError('Conversation not found', 404);
  }),
);

conversationRouter.post(
  '/:id/messages',
  asyncHandler(async () => {
    throw new AppError(
      'Evaluation conversations are not available in this increment',
      501,
    );
  }),
);

export { conversationRouter };
