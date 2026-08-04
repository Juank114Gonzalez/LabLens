import { Router } from 'express';
import { attachmentRouter } from './attachment.routes.js';
import { authRouter } from './auth.routes.js';
import { classificationRouter } from './classification.routes.js';
import { companyContactRouter } from './company-contact.routes.js';
import { conversationRouter } from './conversation.routes.js';
import { criteriaRouter } from './criteria.routes.js';
import { evaluationRouter } from './evaluation.routes.js';
import { initiativeRouter } from './initiative.routes.js';
import { publicRouter } from './public.routes.js';
import { userAdminRouter } from './user-admin.routes.js';
import { workTableRouter } from './work-table.routes.js';

const apiRouter = Router();

// Unauthenticated intake goes first: nothing below it should ever see these requests.
apiRouter.use('/public', publicRouter);

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userAdminRouter);
apiRouter.use('/initiatives', initiativeRouter);
apiRouter.use('/company-contacts', companyContactRouter);
apiRouter.use('/attachments', attachmentRouter);
apiRouter.use('/evaluation-criteria', criteriaRouter);
apiRouter.use('/intelligent-classifications', classificationRouter);
apiRouter.use('/work-tables', workTableRouter);
apiRouter.use('/conversations', conversationRouter);
apiRouter.use('/evaluations', evaluationRouter);

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
