import type { Request, Response } from 'express';
import {
  changeUserRole,
  deleteUserAdmin,
  getUserAdmin,
  listUsersAdmin,
  requestPasswordResetPlaceholder,
  updateUserAdmin,
} from '../services/user-admin.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import type {
  UpdateUserAdminDto,
  UpdateUserRoleDto,
  UserIdParamsDto,
} from '../validators/user-admin.validator.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
}

export async function listUsersController(_req: Request, res: Response) {
  sendSuccess(res, await listUsersAdmin());
}

export async function getUserController(req: Request, res: Response) {
  const { id } = req.params as UserIdParamsDto;
  sendSuccess(res, await getUserAdmin(id));
}

export async function updateUserRoleController(req: Request, res: Response) {
  const actor = requireUser(req);
  const { id } = req.params as UserIdParamsDto;
  const body = req.body as UpdateUserRoleDto;
  sendSuccess(res, await changeUserRole(id, body.role, actor.id));
}

export async function updateUserController(req: Request, res: Response) {
  const actor = requireUser(req);
  const { id } = req.params as UserIdParamsDto;
  const body = req.body as UpdateUserAdminDto;
  sendSuccess(res, await updateUserAdmin(id, body, actor.id));
}

export async function deleteUserController(req: Request, res: Response) {
  const actor = requireUser(req);
  const { id } = req.params as UserIdParamsDto;
  await deleteUserAdmin(id, actor.id);
  sendSuccess(res, { ok: true });
}

export async function resetPasswordController(req: Request, res: Response) {
  const { id } = req.params as UserIdParamsDto;
  sendSuccess(res, await requestPasswordResetPlaceholder(id));
}
