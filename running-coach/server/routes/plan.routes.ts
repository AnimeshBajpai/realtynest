import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../../server/src/config/database.js';
import { authenticateRunner } from '../middleware/runnerAuth.js';
import { generateTrainingPlan } from '../services/planGenerator.js';
import { regenerateNextWeek, shouldRegenerateNextWeek } from '../services/planRegeneration.js';

const router = Router();
router.use(authenticateRunner);

const updateStatusSchema = z.object({
  status: z.enum(['COMPLETED', 'SKIPPED']),
});

// POST /generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const runner = await prisma.runnerProfile.findUnique({
      where: { id: req.runner!.id },
    });
    if (!runner) {
      res.status(404).json({ error: 'Runner not found' });
      return;
    }

    const activeGoal = await prisma.runningGoal.findFirst({
      where: { runnerId: req.runner!.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!activeGoal) {
      res.status(400).json({ error: 'No active goal found. Create a goal first.' });
      return;
    }

    // Delete existing plans for this goal
    await prisma.trainingPlan.deleteMany({
      where: { goalId: activeGoal.id, runnerId: req.runner!.id },
    });

    const planItems = generateTrainingPlan(runner, activeGoal);

    const createdItems = await prisma.trainingPlan.createMany({
      data: planItems.map((item) => ({
        ...item,
        runnerId: req.runner!.id,
        goalId: activeGoal.id,
      })),
    });

    const plan = await prisma.trainingPlan.findMany({
      where: { goalId: activeGoal.id, runnerId: req.runner!.id },
      orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
    });

    res.status(201).json({ count: createdItems.count, plan });
  } catch (err) {
    console.error('Generate plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /current
router.get('/current', async (req: Request, res: Response) => {
  try {
    const runnerId = req.runner!.id;

    // Check if we should auto-regenerate next week
    const needsRegen = await shouldRegenerateNextWeek(runnerId);
    if (needsRegen) {
      try {
        const result = await regenerateNextWeek(runnerId);
        res.json({
          weekNumber: result.weekNumber,
          items: result.items,
          adjustments: result.adjustments,
          regenerated: true,
        });
        return;
      } catch (regenErr) {
        console.error('Auto-regeneration failed (falling back):', regenErr);
        // Fall through to normal lookup
      }
    }

    // Find the earliest incomplete week by weekNumber (timezone-safe)
    const nextPending = await prisma.trainingPlan.findFirst({
      where: { runnerId, status: { in: ['PENDING', 'MODIFIED'] } },
      orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
    });

    if (nextPending) {
      const weekItems = await prisma.trainingPlan.findMany({
        where: { runnerId, weekNumber: nextPending.weekNumber },
        include: { activityLogs: true },
        orderBy: { dayOfWeek: 'asc' },
      });
      res.json({ weekNumber: nextPending.weekNumber, items: weekItems });
      return;
    }

    // No pending items — return empty
    res.json({ items: [] });
  } catch (err) {
    console.error('Get current plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /regenerate — manually trigger next week regeneration
router.post('/regenerate', async (req: Request, res: Response) => {
  try {
    const result = await regenerateNextWeek(req.runner!.id);
    res.json(result);
  } catch (err) {
    console.error('Regenerate plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /week/:weekNumber
router.get('/week/:weekNumber', async (req: Request, res: Response) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber, 10);
    if (isNaN(weekNumber) || weekNumber < 1) {
      res.status(400).json({ error: 'Invalid week number' });
      return;
    }

    const items = await prisma.trainingPlan.findMany({
      where: { runnerId: req.runner!.id, weekNumber },
      include: { activityLogs: true },
      orderBy: { dayOfWeek: 'asc' },
    });

    if (items.length === 0) {
      res.status(404).json({ error: 'No plan found for this week' });
      return;
    }

    res.json({ weekNumber, items });
  } catch (err) {
    console.error('Get week plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id/status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const data = updateStatusSchema.parse(req.body);

    const existing = await prisma.trainingPlan.findFirst({
      where: { id: req.params.id, runnerId: req.runner!.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Plan item not found' });
      return;
    }

    const item = await prisma.trainingPlan.update({
      where: { id: req.params.id },
      data: { status: data.status },
    });

    res.json(item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Update plan status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
