import { prisma } from '../../../server/src/config/database.js';

interface PlanItemInput {
  id: string;
  runnerId: string;
  goalId: string;
  weekNumber: number;
  dayOfWeek: number;
  activityType: string;
  targetDistanceKm: number | null;
  targetPaceMinPerKm: number | null;
  targetDurationMin: number | null;
}

interface ActivityInput {
  distanceKm: number;
  durationMinutes: number;
  avgPaceMinPerKm: number | null;
  effortLevel: number | null;
}

/**
 * Adjust plan when a run is missed.
 * Strategy: Don't pile on — shift the missed run's intensity to the next easy day if close,
 * otherwise just skip it and continue.
 */
export async function adjustForMissedRun(
  plan: PlanItemInput[],
  missedItem: PlanItemInput,
): Promise<{ adjusted: boolean; changes: string[] }> {
  const changes: string[] = [];

  // Find the next pending item in the same week that is an easy run or rest
  const candidates = plan.filter(
    (p) =>
      p.weekNumber === missedItem.weekNumber &&
      p.dayOfWeek > missedItem.dayOfWeek &&
      p.id !== missedItem.id &&
      (p.activityType === 'EASY_RUN' || p.activityType === 'REST' || p.activityType === 'CROSS_TRAIN'),
  );

  if (candidates.length > 0) {
    const replacement = candidates[0];

    // Swap: make the easy day carry some of the missed workout at a reduced intensity
    const reducedDistance = missedItem.targetDistanceKm
      ? Math.round(missedItem.targetDistanceKm * 0.7 * 10) / 10
      : null;

    await prisma.trainingPlan.update({
      where: { id: replacement.id },
      data: {
        activityType: missedItem.activityType as any,
        targetDistanceKm: reducedDistance,
        targetPaceMinPerKm: missedItem.targetPaceMinPerKm,
        targetDurationMin: reducedDistance && missedItem.targetPaceMinPerKm
          ? Math.round(reducedDistance * missedItem.targetPaceMinPerKm * 10) / 10
          : null,
        description: `Rescheduled ${missedItem.activityType.toLowerCase().replace('_', ' ')} (reduced volume)`,
        status: 'MODIFIED',
      },
    });

    changes.push(
      `Moved missed ${missedItem.activityType.replace('_', ' ').toLowerCase()} to day ${replacement.dayOfWeek} with reduced volume (${reducedDistance}km)`,
    );

    return { adjusted: true, changes };
  }

  // No suitable day found — just move on
  changes.push(
    `Missed ${missedItem.activityType.replace('_', ' ').toLowerCase()} — no reschedule needed, continuing as planned`,
  );

  return { adjusted: false, changes };
}

/**
 * Adjust plan when extra effort was detected.
 * Strategy: If a runner went harder than planned, slightly reduce the next easy day
 * to avoid overtraining.
 */
export async function adjustForExtraEffort(
  plan: PlanItemInput[],
  activity: ActivityInput,
): Promise<{ adjusted: boolean; changes: string[] }> {
  const changes: string[] = [];

  if (!activity.effortLevel || activity.effortLevel <= 7) {
    return { adjusted: false, changes };
  }

  // Find next easy run in the plan
  const today = new Date();
  const todayDay = ((today.getDay() + 6) % 7) + 1;

  const nextEasy = plan.find(
    (p) =>
      p.dayOfWeek > todayDay &&
      p.activityType === 'EASY_RUN' &&
      p.targetDistanceKm,
  );

  if (nextEasy && nextEasy.targetDistanceKm) {
    const reducedDistance = Math.round(nextEasy.targetDistanceKm * 0.8 * 10) / 10;

    await prisma.trainingPlan.update({
      where: { id: nextEasy.id },
      data: {
        targetDistanceKm: reducedDistance,
        targetDurationMin: nextEasy.targetPaceMinPerKm
          ? Math.round(reducedDistance * nextEasy.targetPaceMinPerKm * 10) / 10
          : null,
        description: 'Easy run (reduced — recovery after high effort)',
        status: 'MODIFIED',
      },
    });

    changes.push(
      `Reduced next easy run to ${reducedDistance}km for recovery after high-effort session`,
    );

    return { adjusted: true, changes };
  }

  return { adjusted: false, changes };
}

/**
 * Adjust training paces based on recent activity performance.
 * If the runner is consistently faster or slower than target paces,
 * update remaining plan items.
 */
export async function adjustPaces(
  runnerId: string,
  goalId: string,
): Promise<{ adjusted: boolean; changes: string[] }> {
  const changes: string[] = [];

  // Get last 5 completed activities with plan items
  const recentActivities = await prisma.activityLog.findMany({
    where: {
      runnerId,
      wasPlanned: true,
      avgPaceMinPerKm: { not: null },
    },
    orderBy: { date: 'desc' },
    take: 5,
    include: { planItem: true },
  });

  if (recentActivities.length < 3) {
    return { adjusted: false, changes: ['Not enough data to adjust paces (need 3+ planned runs)'] };
  }

  // Calculate average pace deviation
  let totalDeviation = 0;
  let count = 0;

  for (const act of recentActivities) {
    if (act.planItem?.targetPaceMinPerKm && act.avgPaceMinPerKm) {
      totalDeviation += act.avgPaceMinPerKm - act.planItem.targetPaceMinPerKm;
      count++;
    }
  }

  if (count === 0) {
    return { adjusted: false, changes };
  }

  const avgDeviation = totalDeviation / count;

  // Only adjust if deviation is significant (>15 seconds/km)
  if (Math.abs(avgDeviation) < 0.25) {
    return { adjusted: false, changes: ['Paces are on target — no adjustment needed'] };
  }

  // Apply adjustment (halved to be conservative)
  const adjustment = Math.round(avgDeviation * 0.5 * 100) / 100;

  const pendingItems = await prisma.trainingPlan.findMany({
    where: {
      runnerId,
      goalId,
      status: 'PENDING',
      targetPaceMinPerKm: { not: null },
    },
  });

  for (const item of pendingItems) {
    if (item.targetPaceMinPerKm) {
      const newPace = Math.round((item.targetPaceMinPerKm + adjustment) * 100) / 100;
      const newDuration = item.targetDistanceKm
        ? Math.round(item.targetDistanceKm * newPace * 10) / 10
        : null;

      await prisma.trainingPlan.update({
        where: { id: item.id },
        data: {
          targetPaceMinPerKm: newPace,
          targetDurationMin: newDuration,
        },
      });
    }
  }

  const direction = avgDeviation > 0 ? 'slower' : 'faster';
  const absAdj = Math.abs(Math.round(adjustment * 60));
  changes.push(
    `You've been running ${direction} than planned. Adjusted ${pendingItems.length} remaining workouts by ${absAdj}s/km`,
  );

  return { adjusted: true, changes };
}
