import { Router } from 'express';
import {
  getInitiativeController,
  listInitiativesController,
} from '../controllers/initiative.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { initiativeIdParamsSchema } from '../validators/initiative.validator.js';

const initiativeRouter = Router();

initiativeRouter.use(authenticate);

initiativeRouter.get('/', asyncHandler(listInitiativesController));

initiativeRouter.get(
  '/:id',
  validateRequest(initiativeIdParamsSchema, 'params'),
  asyncHandler(getInitiativeController),
);

export { initiativeRouter };
