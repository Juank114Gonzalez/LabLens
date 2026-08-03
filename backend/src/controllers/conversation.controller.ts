import type { Request, Response } from 'express';
import {
  getConversationForActor,
  listConversationsForActor,
  sendConversationMessage,
} from '../services/chat.service.js';
import { generateEvaluationFromConversation } from '../services/evaluation.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import type {
  ConversationIdParamsDto,
  SendMessageDto,
} from '../validators/conversation.validator.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
}

export async function listConversationsController(req: Request, res: Response) {
  const user = requireUser(req);
  sendSuccess(res, await listConversationsForActor(user));
}

export async function getConversationController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as ConversationIdParamsDto;
  sendSuccess(res, await getConversationForActor(id, user));
}

export async function sendMessageController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as ConversationIdParamsDto;
  const { message } = req.body as SendMessageDto;
  sendSuccess(res, await sendConversationMessage(id, message, user));
}

export async function generateEvaluationController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as ConversationIdParamsDto;
  sendSuccess(res, await generateEvaluationFromConversation(id, user));
}
