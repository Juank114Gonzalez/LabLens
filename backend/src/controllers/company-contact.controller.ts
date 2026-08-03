import type { Request, Response } from 'express';
import {
  createContactForActor,
  deleteContactForActor,
  listContactsForInitiative,
  updateContactForActor,
} from '../services/company-contact.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import type {
  CompanyContactIdParamsDto,
  CreateCompanyContactDto,
  UpdateCompanyContactDto,
} from '../validators/company-contact.validator.js';
import { z } from 'zod';

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
}

export async function createCompanyContactController(req: Request, res: Response) {
  const user = requireUser(req);
  const body = req.body as CreateCompanyContactDto;
  const data = await createContactForActor(user, body);
  sendSuccess(res, data, 201);
}

export async function listCompanyContactsController(req: Request, res: Response) {
  const user = requireUser(req);
  const initiativeId = z.string().uuid().parse(req.query.initiativeId);
  const data = await listContactsForInitiative(initiativeId, user);
  sendSuccess(res, data);
}

export async function updateCompanyContactController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as CompanyContactIdParamsDto;
  const body = req.body as UpdateCompanyContactDto;
  const data = await updateContactForActor(id, user, body);
  sendSuccess(res, data);
}

export async function deleteCompanyContactController(req: Request, res: Response) {
  const user = requireUser(req);
  const { id } = req.params as CompanyContactIdParamsDto;
  await deleteContactForActor(id, user);
  sendSuccess(res, { ok: true });
}
