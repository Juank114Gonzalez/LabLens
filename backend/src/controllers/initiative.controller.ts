import type { Request, Response } from 'express';
import { getInitiative, listInitiatives } from '../services/initiative.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import type { InitiativeIdParamsDto } from '../validators/initiative.validator.js';

function requireUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError('Authentication required', 401);
  }
  return req.user.id;
}

export async function listInitiativesController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req);
  const initiatives = await listInitiatives(userId);
  sendSuccess(res, initiatives);
}

export async function getInitiativeController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as InitiativeIdParamsDto;
  const initiative = await getInitiative(id, userId);
  sendSuccess(res, initiative);
}
