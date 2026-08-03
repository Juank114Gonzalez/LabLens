import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createInitiativeController,
  deleteInitiativeController,
  getInitiativeController,
  listInitiativeEvaluationsController,
  listInitiativesController,
  registerInitiativeController,
  startEvaluationController,
  updateInitiativeController,
} from '../controllers/initiative.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createInitiativeSchema,
  initiativeIdParamsSchema,
  startEvaluationBodySchema,
  updateInitiativeSchema,
} from '../validators/initiative.validator.js';

const initiativeRouter = Router();

initiativeRouter.use(authenticate);

initiativeRouter.get('/', asyncHandler(listInitiativesController));

initiativeRouter.post(
  '/',
  authorize(Role.GENERATOR, Role.ADMIN),
  validateRequest(createInitiativeSchema),
  asyncHandler(createInitiativeController),
);

initiativeRouter.get(
  '/:id',
  validateRequest(initiativeIdParamsSchema, 'params'),
  asyncHandler(getInitiativeController),
);

initiativeRouter.patch(
  '/:id',
  authorize(Role.GENERATOR, Role.ADMIN),
  validateRequest(initiativeIdParamsSchema, 'params'),
  validateRequest(updateInitiativeSchema),
  asyncHandler(updateInitiativeController),
);

initiativeRouter.post(
  '/:id/register',
  authorize(Role.GENERATOR, Role.ADMIN),
  validateRequest(initiativeIdParamsSchema, 'params'),
  asyncHandler(registerInitiativeController),
);

initiativeRouter.get(
  '/:id/evaluations',
  validateRequest(initiativeIdParamsSchema, 'params'),
  asyncHandler(listInitiativeEvaluationsController),
);

initiativeRouter.post(
  '/:id/evaluations',
  authorize(Role.EVALUATOR, Role.ADMIN),
  validateRequest(initiativeIdParamsSchema, 'params'),
  validateRequest(startEvaluationBodySchema),
  asyncHandler(startEvaluationController),
);

initiativeRouter.delete(
  '/:id',
  authorize(Role.GENERATOR, Role.ADMIN),
  validateRequest(initiativeIdParamsSchema, 'params'),
  asyncHandler(deleteInitiativeController),
);

export { initiativeRouter };
