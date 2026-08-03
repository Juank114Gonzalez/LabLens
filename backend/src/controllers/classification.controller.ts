import type { Request, Response } from 'express';
import {
  createIntelligentClassification,
  deleteIntelligentClassification,
  getIntelligentClassification,
  listIntelligentClassifications,
  updateIntelligentClassification,
} from '../services/classification.service.js';
import { sendSuccess } from '../utils/response.js';
import type {
  ClassificationIdParamsDto,
  CreateClassificationDto,
  UpdateClassificationDto,
} from '../validators/classification.validator.js';

export async function listClassificationsController(_req: Request, res: Response) {
  sendSuccess(res, await listIntelligentClassifications());
}

export async function getClassificationController(req: Request, res: Response) {
  const { id } = req.params as ClassificationIdParamsDto;
  sendSuccess(res, await getIntelligentClassification(id));
}

export async function createClassificationController(req: Request, res: Response) {
  const body = req.body as CreateClassificationDto;
  sendSuccess(res, await createIntelligentClassification(body), 201);
}

export async function updateClassificationController(req: Request, res: Response) {
  const { id } = req.params as ClassificationIdParamsDto;
  const body = req.body as UpdateClassificationDto;
  sendSuccess(res, await updateIntelligentClassification(id, body));
}

export async function deleteClassificationController(req: Request, res: Response) {
  const { id } = req.params as ClassificationIdParamsDto;
  await deleteIntelligentClassification(id);
  sendSuccess(res, { ok: true });
}
