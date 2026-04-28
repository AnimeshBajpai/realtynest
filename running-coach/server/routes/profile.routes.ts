import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../../server/src/config/database.js';
import { authenticateRunner } from '../middleware/runnerAuth.js';
import { regenerateNextWeek } from '../services/planRegeneration.js';

const router = Router();
router.use(authenticateRunner);

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().min(10).max(120).optional(),
  weightKg: z.number().positive().optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE']).optional(),
  currentWeeklyKm: z.number().min(0).optional(),
  currentPaceMinPerKm: z.number().positive().optional(),
  fitnessLevel: z.number().int().min(1).max(10).optional(),
});

const onboardingSchema = z.object({
  age: z.number().int().min(10).max(120).optional().default(25),
  weightKg: z.number().positive().optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE']),
  currentWeeklyKm: z.number().min(0).optional().default(0),
  currentPaceMinPerKm: z.number().positive().optional().default(7),
  fitnessLevel: z.number().int().min(1).max(10).optional().default(3),
  goalType: z.string().min(1, 'Goal type is required'),
  targetTime: z.string().optional(),
  targetDate: z.string().optional(),
});

// GET /
router.get('/', async (req: Request, res: Response) => {
  try {
    const runner = await prisma.runnerProfile.findUnique({
      where: { id: req.runner!.id },
      include: {
        goals: { where: { status: 'ACTIVE' } },
        badges: { include: { badge: true } },
      },
    });

    if (!runner) {
      res.status(404).json({ error: 'Runner not found' });
      return;
    }

    const { passwordHash: _, ...profile } = runner;
    res.json(profile);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /
router.put('/', async (req: Request, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const runner = await prisma.runnerProfile.update({
      where: { id: req.runner!.id },
      data,
    });

    const { passwordHash: _, ...profile } = runner;
    res.json(profile);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /onboarding
router.put('/onboarding', async (req: Request, res: Response) => {
  try {
    const data = onboardingSchema.parse(req.body);
    const { goalType, targetTime, targetDate, ...profileData } = data;

    // Use transaction to ensure profile + goal + plan are atomic
    const result = await prisma.$transaction(async (tx) => {
      const runner = await tx.runnerProfile.update({
        where: { id: req.runner!.id },
        data: {
          ...profileData,
          onboardingCompleted: true,
        },
      });

      // Create goal (goalType is now required)
      const goalTypeMap: Record<string, string> = {
        distance: 'CUSTOM',
        time: 'CUSTOM',
        race: 'CUSTOM',
        consistency: 'CUSTOM',
      };

      const parsedMinutes = targetTime ? parseFloat(targetTime) || undefined : undefined;

      const createdGoal = await tx.runningGoal.create({
        data: {
          runnerId: req.runner!.id,
          goalType: (goalTypeMap[goalType] || 'CUSTOM') as any,
          targetTimeMinutes: parsedMinutes,
          targetDate: targetDate ? new Date(targetDate) : undefined,
          status: 'ACTIVE',
        },
      });

      return { runner, createdGoal };
    });

    // Auto-generate week 1 of training plan after onboarding (non-fatal)
    try {
      await regenerateNextWeek(req.runner!.id);
    } catch (planErr) {
      console.error('Auto plan generation error (non-fatal):', planErr);
    }

    // Award "Lace Up" onboarding badge
    try {
      const laceUpBadge = await prisma.badge.findUnique({ where: { name: 'Lace Up' } });
      if (laceUpBadge) {
        const alreadyHas = await prisma.runnerBadge.findUnique({
          where: { runnerId_badgeId: { runnerId: req.runner!.id, badgeId: laceUpBadge.id } },
        });
        if (!alreadyHas) {
          await prisma.runnerBadge.create({
            data: { runnerId: req.runner!.id, badgeId: laceUpBadge.id },
          });
          await prisma.runnerProfile.update({
            where: { id: req.runner!.id },
            data: { xpPoints: { increment: laceUpBadge.xpReward } },
          });
        }
      }
    } catch (badgeErr) {
      console.error('Onboarding badge error (non-fatal):', badgeErr);
    }

    const { passwordHash: _, ...profile } = result.runner;
    res.json(profile);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Onboarding error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
