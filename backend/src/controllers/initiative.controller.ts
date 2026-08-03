import type { Request, Response } from 'express';
import {
  createDraftInitiative,
  deleteInitiativeForActor,
  getInitiativeForActor,
  listInitiativesForActor,
  registerInitiativeForActor,
  startEvaluation,
  updateInitiativeForActor,
} from '../services/initiative.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import type {
  CreateInitiativeDto,
  InitiativeIdParamsDto,
  RegisterInitiativeDto,
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
  sendSuccess(res, await listInitiativesForActor(user));
}

export async function createInitiativeController(req: Request, res: Response) {
  const user = requireUser(req);
  const body = (req.body ?? {}) as CreateInitiativeDto;
  const data = await createDraftInitiative(user.id, user.name, body);
  sendSuccess(res, data, 201);
}

export async function getInitiativeController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as InitiativeIdParamsDto;
  sendSuccess(res, await getInitiativeForActor(id, user));
}

export async function updateInitiativeController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as InitiativeIdParamsDto;
  const body = req.body as UpdateInitiativeDto;
  sendSuccess(res, await updateInitiativeForActor(id, user, body));
}

export async function registerInitiativeController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as InitiativeIdParamsDto;
  const body = req.body as RegisterInitiativeDto | undefined;
  sendSuccess(res, await registerInitiativeForActor(id, user, body));
}

export async function deleteInitiativeController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as InitiativeIdParamsDto;
  await deleteInitiativeForActor(id, user);
  sendSuccess(res, { ok: true });
}

export async function listInitiativeEvaluationsController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as InitiativeIdParamsDto;
  const initiative = await getInitiativeForActor(id, user);
  sendSuccess(res, initiative.evaluations);
}

export async function startEvaluationController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as InitiativeIdParamsDto;
  sendSuccess(res, await startEvaluation(id, user), 201);
}
