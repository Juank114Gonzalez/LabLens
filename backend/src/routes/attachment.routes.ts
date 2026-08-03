import { Role } from '@prisma/client';
import { Router } from 'express';
import multer from 'multer';
import {
  deleteAttachmentController,
  listAttachmentsController,
  uploadAttachmentController,
} from '../controllers/attachment.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const attachmentRouter = Router();

attachmentRouter.use(authenticate);

attachmentRouter.get('/', asyncHandler(listAttachmentsController));

attachmentRouter.post(
  '/',
  authorize(Role.GENERATOR, Role.ADMIN),
  upload.single('file'),
  asyncHandler(uploadAttachmentController),
);

attachmentRouter.delete(
  '/:id',
  authorize(Role.GENERATOR, Role.ADMIN),
  asyncHandler(deleteAttachmentController),
);

export { attachmentRouter };
