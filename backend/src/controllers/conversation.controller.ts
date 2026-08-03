import type { Request, Response } from 'express';
import { processConversationMessage } from '../services/chat.service.js';
import {
  getConversationState,
  listUserConversations,
  startConversation,
} from '../services/conversation.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import type {
  ConversationIdParamsDto,
  SendMessageDto,
} from '../validators/conversation.validator.js';

function requireUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError('Authentication required', 401);
  }
  return req.user.id;
}

export async function listConversationsController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req);
  const conversations = await listUserConversations(userId);
  sendSuccess(res, conversations);
}

export async function createConversationController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req);
  const conversation = await startConversation(userId);
  sendSuccess(res, conversation, 201);
}

export async function getConversationController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as ConversationIdParamsDto;
  const conversation = await getConversationState(id, userId);
  sendSuccess(res, conversation);
}

export async function sendMessageController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as ConversationIdParamsDto;
  const { message } = req.body as SendMessageDto;
  const result = await processConversationMessage(id, userId, message);
  sendSuccess(res, result);
}
