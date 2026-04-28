import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../../server/src/config/database.js';
import { authenticateRunner } from '../middleware/runnerAuth.js';
import { calculateXP, checkLevelUp, checkBadgeUnlocks, updateStreak } from '../services/xpService.js';
import { adjustForExtraEffort, adjustPaces } from '../services/planAdjuster.js';
import { shouldRegenerateNextWeek, regenerateNextWeek } from '../services/planRegeneration.js';

const router = Router();
router.use(authenticateRunner);

const createActivitySchema = z.object({
  date: z.string().datetime().optional(),
  distanceKm: z.number().positive(),
  durationMinutes: z.number().positive(),
  effortLevel: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
  planItemId: z.string().uuid().optional(),
});

// POST /
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createActivitySchema.parse(req.body);
    const runnerId = req.runner!.id;

    const avgPace = data.durationMinutes / data.distanceKm;
    let wasPlanned = false;

    if (data.planItemId) {
      const planItem = await prisma.trainingPlan.findFirst({
        where: { id: data.planItemId, runnerId },
      });
      if (planItem) {
        wasPlanned = true;
        await prisma.trainingPlan.update({
          where: { id: data.planItemId },
          data: { status: 'COMPLETED' },
        });
      }
    }

    const runner = await prisma.runnerProfile.findUnique({ where: { id: runnerId } });
    if (!runner) {
      res.status(404).json({ error: 'Runner not found' });
      return;
    }

    const xpEarned = calculateXP(
      { distanceKm: data.distanceKm, durationMinutes: data.durationMinutes },
      wasPlanned,
      runner.currentStreak,
    );

    const activity = await prisma.activityLog.create({
      data: {
        runnerId,
        planItemId: data.planItemId || null,
        date: data.date ? new Date(data.date) : new Date(),
        distanceKm: data.distanceKm,
        durationMinutes: data.durationMinutes,
        avgPaceMinPerKm: avgPace,
        effortLevel: data.effortLevel,
        notes: data.notes,
        wasPlanned,
        xpEarned,
      },
    });

    // Update XP and streak
    await prisma.runnerProfile.update({
      where: { id: runnerId },
      data: {
        xpPoints: { increment: xpEarned },
        lastActiveDate: new Date(),
      },
    });

    const updatedRunner = await prisma.runnerProfile.findUnique({ where: { id: runnerId } });
    if (updatedRunner) {
      await updateStreak(updatedRunner);
      const levelUp = await checkLevelUp(updatedRunner);
      const newBadges = await checkBadgeUnlocks(updatedRunner, activity);

      // --- Dynamic plan adjustment ---
      let planAdjustments: string[] = [];
      try {
        const activeGoal = await prisma.runningGoal.findFirst({
          where: { runnerId, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        });

        if (activeGoal) {
          const currentPlanItems = await prisma.trainingPlan.findMany({
            where: { runnerId, goalId: activeGoal.id },
            orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
          });

          if (currentPlanItems.length > 0) {
            // Check if effort was high → reduce next easy day
            const effortResult = await adjustForExtraEffort(currentPlanItems, {
              distanceKm: data.distanceKm,
              durationMinutes: data.durationMinutes,
              avgPaceMinPerKm: avgPace,
              effortLevel: data.effortLevel ?? null,
            });
            if (effortResult.adjusted) {
              planAdjustments.push(...effortResult.changes);
            }

            // Check if paces need recalibration (needs 3+ planned runs)
            const paceResult = await adjustPaces(runnerId, activeGoal.id);
            if (paceResult.adjusted) {
              planAdjustments.push(...paceResult.changes);
            }
          }
        }

        // Store plan adjustment as coach interaction if changes were made
        if (planAdjustments.length > 0) {
          await prisma.coachInteraction.create({
            data: {
              runnerId,
              type: 'PLAN_ADJUSTMENT',
              message: planAdjustments.join('\n'),
              metadata: { adjustments: planAdjustments, activityId: activity.id },
            },
          });
        }

        // Check if completing this activity triggers next week generation
        try {
          const needsRegen = await shouldRegenerateNextWeek(runnerId);
          if (needsRegen) {
            const regenResult = await regenerateNextWeek(runnerId);
            planAdjustments.push(`📋 Week ${regenResult.weekNumber} plan generated`);
            if (regenResult.adjustments.length > 0) {
              planAdjustments.push(...regenResult.adjustments);
            }
          }
        } catch (regenErr) {
          console.error('Post-activity regen error (non-fatal):', regenErr);
        }
      } catch (adjustErr) {
        console.error('Plan adjustment error (non-fatal):', adjustErr);
      }

      res.status(201).json({
        activity,
        xpEarned,
        levelUp,
        newBadges,
        totalXP: updatedRunner.xpPoints,
        planAdjustments,
      });
      return;
    }

    res.status(201).json({ activity, xpEarned });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Log activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { runnerId: req.runner!.id };

    if (req.query.from || req.query.to) {
      where.date = {};
      if (req.query.from) (where.date as Record<string, unknown>).gte = new Date(req.query.from as string);
      if (req.query.to) (where.date as Record<string, unknown>).lte = new Date(req.query.to as string);
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: { planItem: true },
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('List activities error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /recent
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activities = await prisma.activityLog.findMany({
      where: {
        runnerId: req.runner!.id,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'desc' },
      include: { planItem: true },
    });

    res.json(activities);
  } catch (err) {
    console.error('Recent activities error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const activity = await prisma.activityLog.findFirst({
      where: { id: req.params.id, runnerId: req.runner!.id },
      include: { planItem: true },
    });

    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    res.json(activity);
  } catch (err) {
    console.error('Get activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.activityLog.findFirst({
      where: { id: req.params.id, runnerId: req.runner!.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    const updateSchema = z.object({
      distanceKm: z.number().positive().optional(),
      durationMinutes: z.number().positive().optional(),
      effortLevel: z.number().int().min(1).max(10).optional(),
      notes: z.string().optional(),
      date: z.string().datetime().optional(),
    });
    const data = updateSchema.parse(req.body);

    const updatedData: Record<string, unknown> = { ...data };
    if (data.date) updatedData.date = new Date(data.date);
    if (data.distanceKm && data.durationMinutes) {
      updatedData.avgPaceMinPerKm = data.durationMinutes / data.distanceKm;
    } else if (data.distanceKm) {
      updatedData.avgPaceMinPerKm = existing.durationMinutes / data.distanceKm;
    } else if (data.durationMinutes) {
      updatedData.avgPaceMinPerKm = data.durationMinutes / existing.distanceKm;
    }

    const activity = await prisma.activityLog.update({
      where: { id: req.params.id },
      data: updatedData,
    });

    res.json(activity);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Update activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.activityLog.findFirst({
      where: { id: req.params.id, runnerId: req.runner!.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    await prisma.activityLog.delete({ where: { id: req.params.id } });

    // Deduct XP
    await prisma.runnerProfile.update({
      where: { id: req.runner!.id },
      data: { xpPoints: { decrement: existing.xpEarned } },
    });

    res.json({ message: 'Activity deleted', xpDeducted: existing.xpEarned });
  } catch (err) {
    console.error('Delete activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
