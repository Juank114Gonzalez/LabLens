import { Router } from 'express';
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validateRequest(registerSchema),
  asyncHandler(registerController),
);

authRouter.post('/login', validateRequest(loginSchema), asyncHandler(loginController));

authRouter.post('/logout', asyncHandler(logoutController));

authRouter.post('/refresh', asyncHandler(refreshController));

authRouter.get('/me', authenticate, asyncHandler(meController));

export { authRouter };
