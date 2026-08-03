import type { Request, Response } from 'express';
import {
  createInitiativeForUser,
  deleteInitiativeForActor,
  getInitiativeForActor,
  listInitiativesForActor,
  updateInitiativeForActor,
} from '../services/initiative.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import type {
  CreateInitiativeDto,
  InitiativeIdParamsDto,
  UpdateInitiativeDto,
} from '../validators/initiative.validator.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
}

export async function listInitiativesController(req: Request, res: Response) {
  const user = requireUser(req);
  const data = await listInitiativesForActor(user);
  sendSuccess(res, data);
}

export async function createInitiativeController(req: Request, res: Response) {
  const user = requireUser(req);
  const body = req.body as CreateInitiativeDto;
  const data = await createInitiativeForUser(user.id, body);
  sendSuccess(res, data, 201);
}

export async function getInitiativeController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as InitiativeIdParamsDto;
  const data = await getInitiativeForActor(id, user);
  sendSuccess(res, data);
}

export async function updateInitiativeController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as InitiativeIdParamsDto;
  const body = req.body as UpdateInitiativeDto;
  const data = await updateInitiativeForActor(id, user, body);
  sendSuccess(res, data);
}

export async function deleteInitiativeController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as InitiativeIdParamsDto;
  await deleteInitiativeForActor(id, user);
  sendSuccess(res, { ok: true });
}
