import { Router } from 'express';
import {
  createConversationController,
  getConversationController,
  listConversationsController,
  sendMessageController,
} from '../controllers/conversation.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  conversationIdParamsSchema,
  sendMessageSchema,
} from '../validators/conversation.validator.js';

const conversationRouter = Router();

conversationRouter.use(authenticate);

conversationRouter.get('/', asyncHandler(listConversationsController));

conversationRouter.post('/', asyncHandler(createConversationController));

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

export { conversationRouter };
