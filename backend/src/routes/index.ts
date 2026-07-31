import { Router } from 'express';
import { conversationRouter } from './conversation.routes.js';

const apiRouter = Router();

apiRouter.use('/conversations', conversationRouter);

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'lablens-backend',
    },
  });
});

export { apiRouter };
