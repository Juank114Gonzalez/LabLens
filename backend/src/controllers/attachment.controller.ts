import type { Request, Response } from 'express';
import {
  deleteAttachmentForActor,
  downloadAttachmentsZip,
  listAttachmentsForInitiative,
  uploadAttachmentForInitiative,
} from '../services/attachment.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { z } from 'zod';

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
}

export async function uploadAttachmentController(req: Request, res: Response) {
  const user = requireUser(req);
  const initiativeId = z.string().uuid().parse(req.body.initiativeId);
  if (!req.file) {
    throw new AppError('file is required', 400);
  }
  const data = await uploadAttachmentForInitiative(initiativeId, user, req.file);
  sendSuccess(res, data, 201);
}

export async function listAttachmentsController(req: Request, res: Response) {
  const user = requireUser(req);
  const initiativeId = z.string().uuid().parse(req.query.initiativeId);
  const data = await listAttachmentsForInitiative(initiativeId, user);
  sendSuccess(res, data);
}

export async function downloadAttachmentsController(req: Request, res: Response) {
  const user = requireUser(req);
  const initiativeId = z.string().uuid().parse(req.query.initiativeId);
  const { stream, filename } = await downloadAttachmentsZip(initiativeId, user);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  stream.pipe(res);
}

export async function deleteAttachmentController(req: Request, res: Response) {
  const user = requireUser(req);
  const id = z.string().uuid().parse(req.params.id);
  await deleteAttachmentForActor(id, user);
  sendSuccess(res, { ok: true });
}
