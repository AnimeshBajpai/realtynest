import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
const router = Router();
// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Mount routes
router.use('/auth', authRouter);
router.use('/users', userRouter);
export default router;
