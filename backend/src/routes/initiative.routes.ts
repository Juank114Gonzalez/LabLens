import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  copyInitiativeController,
  createInitiativeController,
  deleteInitiativeController,
  getInitiativeController,
  getInitiativeStatsController,
  listInitiativeEvaluationsController,
  listInitiativesController,
  registerInitiativeController,
  retriageInitiativeController,
  startEvaluationController,
  triageSweepController,
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
  triageSweepBodySchema,
  updateInitiativeSchema,
} from '../validators/initiative.validator.js';

const initiativeRouter = Router();

initiativeRouter.use(authenticate);

initiativeRouter.get('/', asyncHandler(listInitiativesController));

// Registered before '/:id' so "stats" is not read as an initiative id.
initiativeRouter.get(
  '/stats',
  authorize(Role.EVALUATOR, Role.ADMIN),
  asyncHandler(getInitiativeStatsController),
);

// Igual que 'stats': antes de '/:id' para que no se lea como un identificador.
initiativeRouter.post(
  '/triage-sweep',
  authorize(Role.ADMIN),
  validateRequest(triageSweepBodySchema),
  asyncHandler(triageSweepController),
);

initiativeRouter.post(
  '/',
  authorize(Role.EVALUATOR, Role.ADMIN),
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
  authorize(Role.EVALUATOR, Role.ADMIN),
  validateRequest(initiativeIdParamsSchema, 'params'),
  validateRequest(updateInitiativeSchema),
  asyncHandler(updateInitiativeController),
);

initiativeRouter.post(
  '/:id/register',
  authorize(Role.EVALUATOR, Role.ADMIN),
  validateRequest(initiativeIdParamsSchema, 'params'),
  asyncHandler(registerInitiativeController),
);

initiativeRouter.get(
  '/:id/evaluations',
  validateRequest(initiativeIdParamsSchema, 'params'),
  asyncHandler(listInitiativeEvaluationsController),
);

initiativeRouter.post(
  '/:id/triage',
  authorize(Role.EVALUATOR, Role.ADMIN),
  validateRequest(initiativeIdParamsSchema, 'params'),
  asyncHandler(retriageInitiativeController),
);

initiativeRouter.post(
  '/:id/copy',
  authorize(Role.EVALUATOR, Role.ADMIN),
  validateRequest(initiativeIdParamsSchema, 'params'),
  asyncHandler(copyInitiativeController),
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
  authorize(Role.EVALUATOR, Role.ADMIN),
  validateRequest(initiativeIdParamsSchema, 'params'),
  asyncHandler(deleteInitiativeController),
);

export { initiativeRouter };
