import type { Request, Response } from 'express';
import { submitPublicInitiative } from '../services/public-initiative.service.js';
import { sendSuccess } from '../utils/response.js';
import type { PublicInitiativeDto } from '../validators/public-initiative.validator.js';

export async function submitPublicInitiativeController(req: Request, res: Response) {
  const body = req.body as PublicInitiativeDto;
  sendSuccess(res, await submitPublicInitiative(body), 201);
}
