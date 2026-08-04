import { Role } from '@prisma/client';
import { Router } from 'express';
import {
  createCompanyContactController,
  deleteCompanyContactController,
  listCompanyContactsController,
  updateCompanyContactController,
} from '../controllers/company-contact.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  companyContactIdParamsSchema,
  createCompanyContactSchema,
  updateCompanyContactSchema,
} from '../validators/company-contact.validator.js';

const companyContactRouter = Router();

companyContactRouter.use(authenticate);

companyContactRouter.get('/', asyncHandler(listCompanyContactsController));

companyContactRouter.post(
  '/',
  authorize(Role.EVALUATOR, Role.ADMIN),
  validateRequest(createCompanyContactSchema),
  asyncHandler(createCompanyContactController),
);

companyContactRouter.patch(
  '/:id',
  authorize(Role.EVALUATOR, Role.ADMIN),
  validateRequest(companyContactIdParamsSchema, 'params'),
  validateRequest(updateCompanyContactSchema),
  asyncHandler(updateCompanyContactController),
);

companyContactRouter.delete(
  '/:id',
  authorize(Role.EVALUATOR, Role.ADMIN),
  validateRequest(companyContactIdParamsSchema, 'params'),
  asyncHandler(deleteCompanyContactController),
);

export { companyContactRouter };
