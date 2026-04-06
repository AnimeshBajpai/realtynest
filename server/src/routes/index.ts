import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import leadRouter from './lead.routes.js';
import adminRouter from './admin.routes.js';
import propertyRouter from './property.routes.js';
import communicationRouter from './communication.routes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/leads', leadRouter);
router.use('/admin', adminRouter);
router.use('/properties', propertyRouter);
router.use('/', communicationRouter);

export default router;
