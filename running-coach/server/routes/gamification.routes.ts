import { Router, type Request, type Response } from 'express';
import { prisma } from '../../../server/src/config/database.js';
import { authenticateRunner } from '../middleware/runnerAuth.js';
import { LEVEL_THRESHOLDS, LEVEL_NAMES } from '../services/xpService.js';

const router = Router();
router.use(authenticateRunner);

// GET /stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const runner = await prisma.runnerProfile.findUnique({
      where: { id: req.runner!.id },
    });
    if (!runner) {
      res.status(404).json({ error: 'Runner not found' });
      return;
    }

    const badgeCount = await prisma.runnerBadge.count({
      where: { runnerId: runner.id },
    });

    const totalBadges = await prisma.badge.count();

    const nextLevelXP = LEVEL_THRESHOLDS[runner.level] ?? null;
    const currentLevelXP = LEVEL_THRESHOLDS[runner.level - 1] ?? 0;
    const progress = nextLevelXP
      ? Math.round(((runner.xpPoints - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
      : 100;

    res.json({
      xpPoints: runner.xpPoints,
      level: runner.level,
      levelName: LEVEL_NAMES[runner.level - 1] ?? 'Unknown',
      currentStreak: runner.currentStreak,
      longestStreak: runner.longestStreak,
      badgesEarned: badgeCount,
      totalBadges,
      nextLevelXP,
      progressPercent: Math.min(100, Math.max(0, progress)),
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /badges
router.get('/badges', async (req: Request, res: Response) => {
  try {
    const allBadges = await prisma.badge.findMany({
      include: {
        runners: {
          where: { runnerId: req.runner!.id },
        },
      },
    });

    const badges = allBadges.map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      iconName: badge.iconName,
      xpReward: badge.xpReward,
      earned: badge.runners.length > 0,
      earnedAt: badge.runners[0]?.earnedAt ?? null,
    }));

    res.json(badges);
  } catch (err) {
    console.error('Get badges error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const runners = await prisma.runnerProfile.findMany({
      orderBy: { xpPoints: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        level: true,
        xpPoints: true,
        currentStreak: true,
      },
    });

    const leaderboard = runners.map((r, index) => ({
      rank: index + 1,
      ...r,
      levelName: LEVEL_NAMES[r.level - 1] ?? 'Unknown',
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
