import type { Request, Response } from 'express';
import {
  deleteEvaluationForAdmin,
  getEvaluationResultForActor,
  listEvaluationsForActor,
} from '../services/evaluation.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { z } from 'zod';

const evaluationIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
}

export async function listEvaluationsController(req: Request, res: Response) {
  const user = requireUser(req);
  sendSuccess(res, await listEvaluationsForActor(user));
}

export async function getEvaluationController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = evaluationIdParamsSchema.parse(req.params);
  sendSuccess(res, await getEvaluationResultForActor(id, user));
}

export async function deleteEvaluationController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = evaluationIdParamsSchema.parse(req.params);
  sendSuccess(res, await deleteEvaluationForAdmin(id, user));
}

export { evaluationIdParamsSchema };
