import { prisma } from '../../../server/src/config/database.js';

export const LEVEL_THRESHOLDS: Record<number, number> = {
  0: 0,     // Level 1
  1: 100,   // Level 2
  2: 300,   // Level 3
  3: 600,   // Level 4
  4: 1000,  // Level 5
  5: 1500,  // Level 6
  6: 2200,  // Level 7
  7: 3000,  // Level 8
  8: 4000,  // Level 9
  9: 5000,  // Level 10
};

export const LEVEL_NAMES: string[] = [
  'Couch Potato',
  'Jogger',
  'Runner',
  'Racer',
  'Speedster',
  'Marathoner',
  'Iron Runner',
  'Ultra Beast',
  'Legend',
  'GOAT',
];

interface ActivityInput {
  distanceKm: number;
  durationMinutes: number;
}

interface RunnerInput {
  id: string;
  xpPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
}

interface ActivityLogInput {
  id: string;
  distanceKm: number;
  runnerId: string;
}

/**
 * Calculate XP earned for an activity.
 * Base: 10 XP per km
 * Planned bonus: +50%
 * Streak bonus: +5% per streak day (max 50%)
 */
export function calculateXP(
  activity: ActivityInput,
  wasPlanned: boolean,
  streakDays: number,
): number {
  const baseXP = Math.round(activity.distanceKm * 10);
  const plannedBonus = wasPlanned ? Math.round(baseXP * 0.5) : 0;
  const streakMultiplier = Math.min(0.5, streakDays * 0.05);
  const streakBonus = Math.round(baseXP * streakMultiplier);

  return baseXP + plannedBonus + streakBonus;
}

/**
 * Check if the runner leveled up and update if so.
 * Returns the new level info or null if no change.
 */
export async function checkLevelUp(
  runner: RunnerInput,
): Promise<{ newLevel: number; levelName: string } | null> {
  let newLevel = runner.level;

  // Find the highest level the runner qualifies for
  for (let lvl = 9; lvl >= 0; lvl--) {
    if (runner.xpPoints >= LEVEL_THRESHOLDS[lvl]) {
      newLevel = lvl + 1;
      break;
    }
  }

  if (newLevel > runner.level) {
    await prisma.runnerProfile.update({
      where: { id: runner.id },
      data: { level: newLevel },
    });

    return {
      newLevel,
      levelName: LEVEL_NAMES[newLevel - 1] ?? 'Unknown',
    };
  }

  return null;
}

/**
 * Check if any badges should be unlocked based on the runner's activity.
 */
export async function checkBadgeUnlocks(
  runner: RunnerInput,
  activity: ActivityLogInput,
): Promise<Array<{ badgeName: string; xpReward: number }>> {
  const earnedBadges: Array<{ badgeName: string; xpReward: number }> = [];

  const allBadges = await prisma.badge.findMany({
    include: {
      runners: { where: { runnerId: runner.id } },
    },
  });

  const unearnedBadges = allBadges.filter((b) => b.runners.length === 0);

  // Get runner's aggregated stats for badge checking
  const totalActivities = await prisma.activityLog.count({
    where: { runnerId: runner.id },
  });

  const totalDistance = await prisma.activityLog.aggregate({
    where: { runnerId: runner.id },
    _sum: { distanceKm: true },
  });

  const stats = {
    totalRuns: totalActivities,
    totalDistanceKm: totalDistance._sum.distanceKm ?? 0,
    currentStreak: runner.currentStreak,
    longestStreak: runner.longestStreak,
    lastActivityDistanceKm: activity.distanceKm,
    level: runner.level,
  };

  for (const badge of unearnedBadges) {
    let criteria: Record<string, number>;
    try {
      criteria = JSON.parse(badge.criteria) as Record<string, number>;
    } catch {
      continue;
    }

    // Skip onboarding-only badges (awarded separately during onboarding)
    if ((criteria as any).onboarding) continue;

    let earned = true;

    if (criteria.minTotalRuns && stats.totalRuns < criteria.minTotalRuns) earned = false;
    if (criteria.minTotalDistanceKm && stats.totalDistanceKm < criteria.minTotalDistanceKm) earned = false;
    if (criteria.minStreak && stats.currentStreak < criteria.minStreak) earned = false;
    if (criteria.minSingleRunKm && stats.lastActivityDistanceKm < criteria.minSingleRunKm) earned = false;
    if (criteria.minLevel && stats.level < criteria.minLevel) earned = false;

    if (earned) {
      await prisma.runnerBadge.create({
        data: { runnerId: runner.id, badgeId: badge.id },
      });

      // Award badge XP
      await prisma.runnerProfile.update({
        where: { id: runner.id },
        data: { xpPoints: { increment: badge.xpReward } },
      });

      earnedBadges.push({ badgeName: badge.name, xpReward: badge.xpReward });
    }
  }

  return earnedBadges;
}

/**
 * Update the runner's streak count.
 * A streak increments when there's activity on consecutive calendar days.
 */
export async function updateStreak(runner: RunnerInput): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (runner.lastActiveDate) {
    const lastActive = new Date(runner.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (today.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000),
    );

    if (diffDays === 0) {
      // Already active today, no change
      return;
    } else if (diffDays === 1) {
      // Consecutive day — increment streak
      const newStreak = runner.currentStreak + 1;
      await prisma.runnerProfile.update({
        where: { id: runner.id },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(runner.longestStreak, newStreak),
        },
      });
    } else {
      // Streak broken — reset to 1
      await prisma.runnerProfile.update({
        where: { id: runner.id },
        data: { currentStreak: 1 },
      });
    }
  } else {
    // First ever activity
    await prisma.runnerProfile.update({
      where: { id: runner.id },
      data: { currentStreak: 1, longestStreak: Math.max(runner.longestStreak, 1) },
    });
  }
}
