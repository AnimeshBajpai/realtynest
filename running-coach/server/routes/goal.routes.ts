import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../../server/src/config/database.js';
import { authenticateRunner } from '../middleware/runnerAuth.js';

const router = Router();
router.use(authenticateRunner);

const createGoalSchema = z.object({
  goalType: z.enum(['FIVE_K', 'TEN_K', 'HALF_MARATHON', 'FULL_MARATHON', 'CUSTOM']),
  targetDistanceKm: z.number().positive().optional(),
  targetTimeMinutes: z.number().positive().optional(),
  targetDate: z.string().datetime().optional(),
});

const updateGoalSchema = z.object({
  goalType: z.enum(['FIVE_K', 'TEN_K', 'HALF_MARATHON', 'FULL_MARATHON', 'CUSTOM']).optional(),
  targetDistanceKm: z.number().positive().optional(),
  targetTimeMinutes: z.number().positive().optional(),
  targetDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED', 'ABANDONED']).optional(),
});

// POST /
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createGoalSchema.parse(req.body);

    const goal = await prisma.runningGoal.create({
      data: {
        runnerId: req.runner!.id,
        goalType: data.goalType,
        targetDistanceKm: data.targetDistanceKm,
        targetTimeMinutes: data.targetTimeMinutes,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });

    res.status(201).json(goal);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /
router.get('/', async (req: Request, res: Response) => {
  try {
    const goals = await prisma.runningGoal.findMany({
      where: { runnerId: req.runner!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(goals);
  } catch (err) {
    console.error('List goals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const goal = await prisma.runningGoal.findFirst({
      where: { id: req.params.id, runnerId: req.runner!.id },
      include: { trainingPlans: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] } },
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.json(goal);
  } catch (err) {
    console.error('Get goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = updateGoalSchema.parse(req.body);

    const existing = await prisma.runningGoal.findFirst({
      where: { id: req.params.id, runnerId: req.runner!.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const goal = await prisma.runningGoal.update({
      where: { id: req.params.id },
      data: {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });

    res.json(goal);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.runningGoal.findFirst({
      where: { id: req.params.id, runnerId: req.runner!.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    await prisma.runningGoal.delete({ where: { id: req.params.id } });

    res.status(204).send();
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
