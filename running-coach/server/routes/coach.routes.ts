import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../../server/src/config/database.js';
import { authenticateRunner } from '../middleware/runnerAuth.js';
import { getGreeting, getCheckInMessage } from '../services/coachEngine.js';

const router = Router();
router.use(authenticateRunner);

const checkInSchema = z.object({
  completed: z.boolean(),
  planItemId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// GET /greeting
router.get('/greeting', async (req: Request, res: Response) => {
  try {
    const runner = await prisma.runnerProfile.findUnique({
      where: { id: req.runner!.id },
    });
    if (!runner) {
      res.status(404).json({ error: 'Runner not found' });
      return;
    }

    const lastActivity = await prisma.activityLog.findFirst({
      where: { runnerId: runner.id },
      orderBy: { date: 'desc' },
    });

    const todaysPlan = await prisma.trainingPlan.findFirst({
      where: {
        runnerId: runner.id,
        status: 'PENDING',
        dayOfWeek: ((new Date().getDay() + 6) % 7) + 1, // 1=Mon ... 7=Sun
      },
      orderBy: { weekNumber: 'asc' },
    });

    // Check for recent plan adjustments (last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentAdjustments = await prisma.coachInteraction.findMany({
      where: {
        runnerId: runner.id,
        type: 'PLAN_ADJUSTMENT',
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const adjustmentMessages = recentAdjustments.map((a) => a.message);

    const greeting = getGreeting(runner, lastActivity, todaysPlan);

    // Store the interaction
    await prisma.coachInteraction.create({
      data: {
        runnerId: runner.id,
        type: 'GREETING',
        message: greeting,
      },
    });

    res.json({ message: greeting, todaysPlan, planAdjustments: adjustmentMessages });
  } catch (err) {
    console.error('Coach greeting error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /check-in
router.post('/check-in', async (req: Request, res: Response) => {
  try {
    const data = checkInSchema.parse(req.body);
    const runnerId = req.runner!.id;

    const runner = await prisma.runnerProfile.findUnique({
      where: { id: runnerId },
    });
    if (!runner) {
      res.status(404).json({ error: 'Runner not found' });
      return;
    }

    let message: string;

    if (data.completed && data.planItemId) {
      await prisma.trainingPlan.update({
        where: { id: data.planItemId },
        data: { status: 'COMPLETED' },
      });
      message = getCheckInMessage(runner, true);
    } else if (!data.completed && data.planItemId) {
      await prisma.trainingPlan.update({
        where: { id: data.planItemId },
        data: { status: 'SKIPPED' },
      });
      message = getCheckInMessage(runner, false);
    } else {
      message = data.completed
        ? "Great job getting out there today! 💪"
        : "No worries — rest is part of training too. We'll get it next time!";
    }

    const interaction = await prisma.coachInteraction.create({
      data: {
        runnerId,
        type: 'CHECK_IN',
        message,
        userResponse: data.notes || (data.completed ? 'completed' : 'skipped'),
        metadata: { planItemId: data.planItemId, completed: data.completed },
      },
    });

    res.json({ message, interaction });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Coach check-in error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    const interactions = await prisma.coachInteraction.findMany({
      where: { runnerId: req.runner!.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json(interactions);
  } catch (err) {
    console.error('Coach history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
