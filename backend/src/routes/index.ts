import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { conversationRouter } from './conversation.routes.js';
import { initiativeRouter } from './initiative.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/conversations', conversationRouter);
apiRouter.use('/initiatives', initiativeRouter);

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
