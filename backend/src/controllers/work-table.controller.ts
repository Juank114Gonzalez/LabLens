import type { Request, Response } from 'express';
import {
  createWorkTableService,
  deleteWorkTableService,
  getWorkTableService,
  listWorkTablesService,
  updateWorkTableService,
} from '../services/work-table.service.js';
import { sendSuccess } from '../utils/response.js';
import type {
  CreateWorkTableDto,
  UpdateWorkTableDto,
  WorkTableIdParamsDto,
} from '../validators/work-table.validator.js';

export async function listWorkTablesController(_req: Request, res: Response) {
  sendSuccess(res, await listWorkTablesService());
}

export async function getWorkTableController(req: Request, res: Response) {
  const { id } = req.params as WorkTableIdParamsDto;
  sendSuccess(res, await getWorkTableService(id));
}

export async function createWorkTableController(req: Request, res: Response) {
  const body = req.body as CreateWorkTableDto;
  sendSuccess(res, await createWorkTableService(body), 201);
}

export async function updateWorkTableController(req: Request, res: Response) {
  const { id } = req.params as WorkTableIdParamsDto;
  const body = req.body as UpdateWorkTableDto;
  sendSuccess(res, await updateWorkTableService(id, body));
}

export async function deleteWorkTableController(req: Request, res: Response) {
  const { id } = req.params as WorkTableIdParamsDto;
  await deleteWorkTableService(id);
  sendSuccess(res, { ok: true });
}
