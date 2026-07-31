import type { Request, Response } from 'express';
import { processConversationMessage } from '../services/chat.service.js';
import {
  getConversationState,
  startConversation,
} from '../services/conversation.service.js';
import { sendSuccess } from '../utils/response.js';
import type {
  ConversationIdParamsDto,
  SendMessageDto,
} from '../validators/conversation.validator.js';

export async function createConversationController(
  _req: Request,
  res: Response,
): Promise<void> {
  const conversation = await startConversation();
  sendSuccess(res, conversation, 201);
}

export async function getConversationController(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params as ConversationIdParamsDto;
  const conversation = await getConversationState(id);
  sendSuccess(res, conversation);
}

export async function sendMessageController(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params as ConversationIdParamsDto;
  const { message } = req.body as SendMessageDto;
  const result = await processConversationMessage(id, message);
  sendSuccess(res, result);
}
