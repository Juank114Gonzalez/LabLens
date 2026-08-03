import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createClassificationController,
  deleteClassificationController,
  getClassificationController,
  listClassificationsController,
  updateClassificationController,
} from '../controllers/classification.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  classificationIdParamsSchema,
  createClassificationSchema,
  updateClassificationSchema,
} from '../validators/classification.validator.js';

const classificationRouter = Router();

classificationRouter.use(authenticate);

classificationRouter.get('/', asyncHandler(listClassificationsController));

classificationRouter.get(
  '/:id',
  validateRequest(classificationIdParamsSchema, 'params'),
  asyncHandler(getClassificationController),
);

classificationRouter.post(
  '/',
  authorize(Role.ADMIN),
  validateRequest(createClassificationSchema),
  asyncHandler(createClassificationController),
);

classificationRouter.patch(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest(classificationIdParamsSchema, 'params'),
  validateRequest(updateClassificationSchema),
  asyncHandler(updateClassificationController),
);

classificationRouter.delete(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest(classificationIdParamsSchema, 'params'),
  asyncHandler(deleteClassificationController),
);

export { classificationRouter };
