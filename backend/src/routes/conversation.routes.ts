import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  generateEvaluationController,
  getConversationController,
  listConversationsController,
  sendMessageController,
} from '../controllers/conversation.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  conversationIdParamsSchema,
  sendMessageSchema,
} from '../validators/conversation.validator.js';

const conversationRouter = Router();

conversationRouter.use(authenticate, authorize(Role.EVALUATOR, Role.ADMIN));

conversationRouter.get('/', asyncHandler(listConversationsController));

conversationRouter.get(
  '/:id',
  validateRequest(conversationIdParamsSchema, 'params'),
  asyncHandler(getConversationController),
);

conversationRouter.post(
  '/:id/messages',
  validateRequest(conversationIdParamsSchema, 'params'),
  validateRequest(sendMessageSchema),
  asyncHandler(sendMessageController),
);

conversationRouter.post(
  '/:id/generate',
  validateRequest(conversationIdParamsSchema, 'params'),
  asyncHandler(generateEvaluationController),
);

export { conversationRouter };
