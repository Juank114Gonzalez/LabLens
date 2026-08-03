import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  deleteUserController,
  getUserController,
  listUsersController,
  updateUserController,
  updateUserRoleController,
} from '../controllers/user-admin.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  updateUserAdminSchema,
  updateUserRoleSchema,
  userIdParamsSchema,
} from '../validators/user-admin.validator.js';

const userAdminRouter = Router();

userAdminRouter.use(authenticate, authorize(Role.ADMIN));

userAdminRouter.get('/', asyncHandler(listUsersController));

userAdminRouter.get(
  '/:id',
  validateRequest(userIdParamsSchema, 'params'),
  asyncHandler(getUserController),
);

userAdminRouter.patch(
  '/:id/role',
  validateRequest(userIdParamsSchema, 'params'),
  validateRequest(updateUserRoleSchema),
  asyncHandler(updateUserRoleController),
);

userAdminRouter.patch(
  '/:id',
  validateRequest(userIdParamsSchema, 'params'),
  validateRequest(updateUserAdminSchema),
  asyncHandler(updateUserController),
);

userAdminRouter.delete(
  '/:id',
  validateRequest(userIdParamsSchema, 'params'),
  asyncHandler(deleteUserController),
);

export { userAdminRouter };
