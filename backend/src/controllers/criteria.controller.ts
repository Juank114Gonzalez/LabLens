import type { Request, Response } from 'express';
import {
  createEvaluationCriteria,
  deleteEvaluationCriteria,
  getEvaluationCriteria,
  listEvaluationCriteria,
  updateEvaluationCriteria,
} from '../services/criteria.service.js';
import { sendSuccess } from '../utils/response.js';
import type {
  CreateCriteriaDto,
  CriteriaIdParamsDto,
  UpdateCriteriaDto,
} from '../validators/criteria.validator.js';

export async function listCriteriaController(_req: Request, res: Response) {
  sendSuccess(res, await listEvaluationCriteria());
}

export async function getCriteriaController(req: Request, res: Response) {
  const { id } = req.params as CriteriaIdParamsDto;
  sendSuccess(res, await getEvaluationCriteria(id));
}

export async function createCriteriaController(req: Request, res: Response) {
  const body = req.body as CreateCriteriaDto;
  sendSuccess(res, await createEvaluationCriteria(body), 201);
}

export async function updateCriteriaController(req: Request, res: Response) {
  const { id } = req.params as CriteriaIdParamsDto;
  const body = req.body as UpdateCriteriaDto;
  sendSuccess(res, await updateEvaluationCriteria(id, body));
}

export async function deleteCriteriaController(req: Request, res: Response) {
  const { id } = req.params as CriteriaIdParamsDto;
  await deleteEvaluationCriteria(id);
  sendSuccess(res, { ok: true });
}
