import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  evaluationIdParamsSchema,
  getEvaluationController,
  listEvaluationsController,
} from '../controllers/evaluation.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const evaluationRouter = Router();

evaluationRouter.use(authenticate, authorize(Role.EVALUATOR, Role.ADMIN));

evaluationRouter.get('/', asyncHandler(listEvaluationsController));

evaluationRouter.get(
  '/:id',
  validateRequest(evaluationIdParamsSchema, 'params'),
  asyncHandler(getEvaluationController),
);

export { evaluationRouter };
