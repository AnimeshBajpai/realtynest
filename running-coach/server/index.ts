import { Router } from 'express';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import goalRoutes from './routes/goal.routes.js';
import planRoutes from './routes/plan.routes.js';
import activityRoutes from './routes/activity.routes.js';
import coachRoutes from './routes/coach.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';

const runningCoachRouter = Router();

runningCoachRouter.use('/auth', authRoutes);
runningCoachRouter.use('/profile', profileRoutes);
runningCoachRouter.use('/goals', goalRoutes);
runningCoachRouter.use('/plan', planRoutes);
runningCoachRouter.use('/activity', activityRoutes);
runningCoachRouter.use('/coach', coachRoutes);
runningCoachRouter.use('/gamification', gamificationRoutes);

export default runningCoachRouter;
