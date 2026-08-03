import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createCriteriaController,
  deleteCriteriaController,
  getCriteriaController,
  listCriteriaController,
  reorderCriteriaController,
  updateCriteriaController,
} from '../controllers/criteria.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createCriteriaSchema,
  criteriaIdParamsSchema,
  reorderCriteriaSchema,
  updateCriteriaSchema,
} from '../validators/criteria.validator.js';

const criteriaRouter = Router();

criteriaRouter.use(authenticate);

criteriaRouter.get('/', asyncHandler(listCriteriaController));

criteriaRouter.put(
  '/reorder',
  authorize(Role.ADMIN),
  validateRequest(reorderCriteriaSchema),
  asyncHandler(reorderCriteriaController),
);

criteriaRouter.get(
  '/:id',
  validateRequest(criteriaIdParamsSchema, 'params'),
  asyncHandler(getCriteriaController),
);

criteriaRouter.post(
  '/',
  authorize(Role.ADMIN),
  validateRequest(createCriteriaSchema),
  asyncHandler(createCriteriaController),
);

criteriaRouter.patch(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest(criteriaIdParamsSchema, 'params'),
  validateRequest(updateCriteriaSchema),
  asyncHandler(updateCriteriaController),
);

criteriaRouter.delete(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest(criteriaIdParamsSchema, 'params'),
  asyncHandler(deleteCriteriaController),
);

export { criteriaRouter };
