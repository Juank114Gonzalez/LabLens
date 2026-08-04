import { Router } from 'express';
import {
  loginController,
  logoutController,
  meController,
  refreshController,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema } from '../validators/auth.validator.js';

const authRouter = Router();

// No public sign-up: initiatives arrive through /api/public and accounts are
// created by an admin from the user panel.
authRouter.post('/login', validateRequest(loginSchema), asyncHandler(loginController));

authRouter.post('/logout', asyncHandler(logoutController));

authRouter.post('/refresh', asyncHandler(refreshController));

authRouter.get('/me', authenticate, asyncHandler(meController));

export { authRouter };
