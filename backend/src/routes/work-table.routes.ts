import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createWorkTableController,
  deleteWorkTableController,
  getWorkTableController,
  listWorkTablesController,
  updateWorkTableController,
} from '../controllers/work-table.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createWorkTableSchema,
  updateWorkTableSchema,
  workTableIdParamsSchema,
} from '../validators/work-table.validator.js';

const workTableRouter = Router();

workTableRouter.use(authenticate);

workTableRouter.get('/', asyncHandler(listWorkTablesController));

workTableRouter.get(
  '/:id',
  validateRequest(workTableIdParamsSchema, 'params'),
  asyncHandler(getWorkTableController),
);

workTableRouter.post(
  '/',
  authorize(Role.ADMIN),
  validateRequest(createWorkTableSchema),
  asyncHandler(createWorkTableController),
);

workTableRouter.patch(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest(workTableIdParamsSchema, 'params'),
  validateRequest(updateWorkTableSchema),
  asyncHandler(updateWorkTableController),
);

workTableRouter.delete(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest(workTableIdParamsSchema, 'params'),
  asyncHandler(deleteWorkTableController),
);

export { workTableRouter };
