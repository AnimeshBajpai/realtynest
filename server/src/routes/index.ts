import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import leadRouter from './lead.routes.js';
import adminRouter from './admin.routes.js';
import propertyRouter from './property.routes.js';
import communicationRouter from './communication.routes.js';
import dashboardRouter from './dashboard.routes.js';
import notificationRouter from './notification.routes.js';
import searchRouter from './search.routes.js';
import activityRouter from './activity.routes.js';

const router = Router();

// Health check with DB connectivity
router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', timestamp: new Date().toISOString(), db: 'disconnected' });
  }
});

// Mount routes
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/leads', leadRouter);
router.use('/admin', adminRouter);
router.use('/properties', propertyRouter);
router.use('/', communicationRouter);
router.use('/dashboard', dashboardRouter);
router.use('/notifications', notificationRouter);
router.use('/search', searchRouter);
router.use('/activity', authenticateToken, activityRouter);

export default router;
