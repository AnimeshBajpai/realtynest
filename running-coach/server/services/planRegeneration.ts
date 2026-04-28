import { prisma } from '../../../server/src/config/database.js';
import { generateTrainingPlan } from './planGenerator.js';

interface WeekSummary {
  weekNumber: number;
  planned: number;
  completed: number;
  adherenceRate: number;
  avgEffort: number | null;
  avgPaceMinPerKm: number | null;
  totalDistanceKm: number;
}

/**
 * Calculate adherence summary for a completed week.
 */
export async function getWeekSummary(runnerId: string, weekNumber: number): Promise<WeekSummary> {
  const weekItems = await prisma.trainingPlan.findMany({
    where: { runnerId, weekNumber },
    include: { activityLogs: true },
  });

  const planned = weekItems.filter(i => i.activityType !== 'REST' && i.activityType !== 'CROSS_TRAIN').length;
  const completed = weekItems.filter(i => i.status === 'COMPLETED').length;
  const adherenceRate = planned > 0 ? completed / planned : 1;

  // Get all activities for this week
  const activities = weekItems.flatMap(i => i.activityLogs);
  const avgEffort = activities.length > 0
    ? activities.reduce((sum, a) => sum + (a.effortLevel || 5), 0) / activities.length
    : null;
  const avgPace = activities.length > 0
    ? activities.reduce((sum, a) => sum + (a.avgPaceMinPerKm || 0), 0) / activities.filter(a => a.avgPaceMinPerKm).length
    : null;
  const totalDistance = activities.reduce((sum, a) => sum + a.distanceKm, 0);

  return {
    weekNumber,
    planned,
    completed,
    adherenceRate,
    avgEffort,
    avgPaceMinPerKm: avgPace,
    totalDistanceKm: totalDistance,
  };
}

/**
 * Calculate the runner's effective VDOT-based pace from their last 4 weeks of data.
 * Returns null if insufficient data.
 */
export async function getRollingAveragePace(runnerId: string): Promise<number | null> {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const recentRuns = await prisma.activityLog.findMany({
    where: {
      runnerId,
      date: { gte: fourWeeksAgo },
      avgPaceMinPerKm: { not: null },
      distanceKm: { gte: 2 }, // only count runs of 2km+
    },
    orderBy: { date: 'desc' },
  });

  if (recentRuns.length < 3) return null;

  // Weight recent runs more heavily (exponential decay)
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < recentRuns.length; i++) {
    const weight = Math.exp(-i * 0.2); // recent = higher weight
    weightedSum += (recentRuns[i].avgPaceMinPerKm || 0) * weight;
    totalWeight += weight;
  }

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Detect overtraining signals:
 * - High effort (avg > 7) combined with slowing pace over 2+ weeks
 */
async function detectOvertraining(runnerId: string, recentWeeks: WeekSummary[]): Promise<boolean> {
  if (recentWeeks.length < 2) return false;

  const lastTwo = recentWeeks.slice(-2);
  const highEffort = lastTwo.every(w => w.avgEffort !== null && w.avgEffort > 7);
  const slowingPace = lastTwo.length === 2 &&
    lastTwo[0].avgPaceMinPerKm !== null &&
    lastTwo[1].avgPaceMinPerKm !== null &&
    lastTwo[1].avgPaceMinPerKm > lastTwo[0].avgPaceMinPerKm + 0.1;

  return highEffort && slowingPace;
}

/**
 * Calculate volume adjustment factor based on last week's performance.
 * Returns a multiplier: 1.0 = no change, 1.05-1.10 = increase, 0.9 = decrease
 */
function calculateVolumeAdjustment(
  adherenceRate: number,
  avgEffort: number | null,
  isOvertraining: boolean,
): number {
  if (isOvertraining) return 0.85; // significant reduction

  if (adherenceRate < 0.5) return 0.85; // major reduction
  if (adherenceRate < 0.7) return 0.90; // moderate reduction

  if (adherenceRate >= 1.0 && avgEffort !== null) {
    if (avgEffort < 5) return 1.10; // feeling easy → increase 10%
    if (avgEffort < 6) return 1.05; // moderate effort → small increase
  }

  return 1.0; // maintain current level
}

/**
 * Regenerate the next week's plan based on performance data.
 * This is the core dynamic plan function.
 *
 * Called when:
 * - User completes a week (all days pass)
 * - User requests plan refresh
 * - GET /plan/current detects the current week has no generated items
 */
export async function regenerateNextWeek(runnerId: string): Promise<{
  weekNumber: number;
  items: any[];
  adjustments: string[];
}> {
  const adjustments: string[] = [];

  // Find runner and goal
  const runner = await prisma.runnerProfile.findUnique({ where: { id: runnerId } });
  if (!runner) throw new Error('Runner not found');

  const activeGoal = await prisma.runningGoal.findFirst({
    where: { runnerId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
  if (!activeGoal) throw new Error('No active goal');

  // Find the highest existing week number
  const lastPlanItem = await prisma.trainingPlan.findFirst({
    where: { runnerId, goalId: activeGoal.id },
    orderBy: { weekNumber: 'desc' },
  });

  const lastWeekNumber = lastPlanItem?.weekNumber || 0;
  const nextWeekNumber = lastWeekNumber + 1;

  // Get summaries for last 1-4 weeks
  const recentWeekSummaries: WeekSummary[] = [];
  for (let w = Math.max(1, lastWeekNumber - 3); w <= lastWeekNumber; w++) {
    const summary = await getWeekSummary(runnerId, w);
    if (summary.planned > 0) recentWeekSummaries.push(summary);
  }

  // Calculate rolling average pace (fitness-adaptive)
  const rollingPace = await getRollingAveragePace(runnerId);
  let effectivePace = runner.currentPaceMinPerKm || 7.0;

  if (rollingPace !== null) {
    const paceChange = Math.abs(rollingPace - effectivePace);
    if (paceChange > 0.15) { // >9 seconds/km difference
      effectivePace = rollingPace;
      const direction = rollingPace < (runner.currentPaceMinPerKm || 7) ? 'faster' : 'slower';
      adjustments.push(`Pace updated: you're running ${direction} (${formatPace(rollingPace)}/km avg)`);

      // Update runner profile with new effective pace
      await prisma.runnerProfile.update({
        where: { id: runnerId },
        data: { currentPaceMinPerKm: rollingPace },
      });
    }
  }

  // Calculate volume adjustment
  let volumeMultiplier = 1.0;
  if (recentWeekSummaries.length > 0) {
    const lastWeek = recentWeekSummaries[recentWeekSummaries.length - 1];
    const isOvertraining = await detectOvertraining(runnerId, recentWeekSummaries);

    volumeMultiplier = calculateVolumeAdjustment(
      lastWeek.adherenceRate,
      lastWeek.avgEffort,
      isOvertraining,
    );

    if (volumeMultiplier !== 1.0) {
      const pct = Math.round((volumeMultiplier - 1) * 100);
      const label = pct > 0 ? `+${pct}%` : `${pct}%`;
      const reason = isOvertraining
        ? 'overtraining signals detected'
        : lastWeek.adherenceRate < 0.7
          ? `low adherence last week (${Math.round(lastWeek.adherenceRate * 100)}%)`
          : `strong performance (effort ${lastWeek.avgEffort?.toFixed(1) || '?'}/10)`;
      adjustments.push(`Volume ${label} — ${reason}`);
    }

    if (isOvertraining) {
      adjustments.push('⚠️ Recovery mode: high effort + slowing pace detected. Take it easy this week.');
    }
  }

  // Calculate base weekly distance for next week
  let baseWeeklyKm = runner.currentWeeklyKm || 10;
  if (recentWeekSummaries.length > 0) {
    // Use actual completed distance from last week as new base
    const lastActual = recentWeekSummaries[recentWeekSummaries.length - 1].totalDistanceKm;
    if (lastActual > 0) {
      baseWeeklyKm = lastActual;
    }
  }
  const targetWeeklyKm = Math.round(baseWeeklyKm * volumeMultiplier * 10) / 10;

  // Determine phase based on overall plan progress
  const totalPlannedWeeks = getTotalWeeks(activeGoal);
  const phase = getPhaseForWeek(nextWeekNumber, totalPlannedWeeks);
  const isRecovery = nextWeekNumber % 4 === 0;

  // Generate the week
  const weekItems = generateDynamicWeek({
    weekNumber: nextWeekNumber,
    weeklyKm: isRecovery ? targetWeeklyKm * 0.7 : targetWeeklyKm,
    effectivePace,
    phase,
    isRecovery,
    goalDistance: getGoalDistance(activeGoal),
  });

  if (isRecovery) {
    adjustments.push('🔄 Recovery week — reduced volume for adaptation');
  }

  // Delete any existing items for this week (in case of re-generation)
  await prisma.trainingPlan.deleteMany({
    where: { runnerId, goalId: activeGoal.id, weekNumber: nextWeekNumber },
  });

  // Create new plan items
  await prisma.trainingPlan.createMany({
    data: weekItems.map(item => ({
      ...item,
      runnerId,
      goalId: activeGoal.id,
    })),
  });

  // Store regeneration as coach interaction
  if (adjustments.length > 0) {
    await prisma.coachInteraction.create({
      data: {
        runnerId,
        type: 'PLAN_ADJUSTMENT',
        message: `Week ${nextWeekNumber} generated: ${adjustments.join('; ')}`,
        metadata: {
          weekNumber: nextWeekNumber,
          adjustments,
          volumeMultiplier,
          effectivePace,
          phase,
        },
      },
    });
  }

  // Fetch created items
  const items = await prisma.trainingPlan.findMany({
    where: { runnerId, goalId: activeGoal.id, weekNumber: nextWeekNumber },
    orderBy: { dayOfWeek: 'asc' },
  });

  return { weekNumber: nextWeekNumber, items, adjustments };
}

/**
 * Check if it's time to regenerate the next week.
 * Returns true if:
 * - All run items in current week are completed/skipped, OR
 * - Current week is past (based on creation date) and no next week exists
 */
export async function shouldRegenerateNextWeek(runnerId: string): Promise<boolean> {
  const activeGoal = await prisma.runningGoal.findFirst({
    where: { runnerId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
  if (!activeGoal) return false;

  // Find current week (earliest with PENDING items)
  const currentPending = await prisma.trainingPlan.findFirst({
    where: { runnerId, goalId: activeGoal.id, status: { in: ['PENDING', 'MODIFIED'] } },
    orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
  });

  if (!currentPending) {
    // All existing items are done — need next week
    return true;
  }

  // Check if the current week has all run-type activities completed
  const currentWeekItems = await prisma.trainingPlan.findMany({
    where: { runnerId, goalId: activeGoal.id, weekNumber: currentPending.weekNumber },
  });

  const runItems = currentWeekItems.filter(i =>
    i.activityType !== 'REST' && i.activityType !== 'CROSS_TRAIN'
  );
  const allRunsComplete = runItems.every(i => i.status === 'COMPLETED' || i.status === 'SKIPPED');

  // If all runs are done, check if next week exists
  if (allRunsComplete && runItems.length > 0) {
    const nextWeekExists = await prisma.trainingPlan.findFirst({
      where: { runnerId, goalId: activeGoal.id, weekNumber: currentPending.weekNumber + 1 },
    });
    return !nextWeekExists;
  }

  return false;
}

// --- Helpers ---

function formatPace(paceMinPerKm: number): string {
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getTotalWeeks(goal: { goalType: string; targetDate: Date | null }): number {
  if (goal.targetDate) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.max(4, Math.min(24, Math.round(
      (goal.targetDate.getTime() - Date.now()) / msPerWeek
    )));
  }
  const defaults: Record<string, number> = {
    FIVE_K: 8, TEN_K: 10, HALF_MARATHON: 14, FULL_MARATHON: 18, CUSTOM: 10,
  };
  return defaults[goal.goalType] ?? 10;
}

function getGoalDistance(goal: { goalType: string; targetDistanceKm: number | null }): number {
  const distances: Record<string, number> = {
    FIVE_K: 5, TEN_K: 10, HALF_MARATHON: 21.1, FULL_MARATHON: 42.2,
  };
  return distances[goal.goalType] ?? goal.targetDistanceKm ?? 5;
}

function getPhaseForWeek(weekNumber: number, totalWeeks: number): 'base' | 'build' | 'peak' | 'taper' {
  const pct = weekNumber / totalWeeks;
  if (pct < 0.33) return 'base';
  if (pct < 0.75) return 'build';
  if (pct < 0.92) return 'peak';
  return 'taper';
}

function calculatePaces(currentPace: number) {
  return {
    easy: currentPace + 1.25,
    tempo: currentPace + 0.45,
    interval: currentPace - 0.08,
    longRun: currentPace + 1.25,
  };
}

interface WeekConfig {
  weekNumber: number;
  weeklyKm: number;
  effectivePace: number;
  phase: 'base' | 'build' | 'peak' | 'taper';
  isRecovery: boolean;
  goalDistance: number;
}

function generateDynamicWeek(config: WeekConfig) {
  const { weekNumber, weeklyKm, effectivePace, phase, isRecovery, goalDistance } = config;
  const paces = calculatePaces(effectivePace);

  type DayConfig = {
    day: number;
    type: string;
    distPct: number;
    pace: number | null;
    label: string;
  };

  const dayConfigs: DayConfig[] = [
    { day: 1, type: 'REST',        distPct: 0,    pace: null,          label: 'Rest day' },
    { day: 2, type: 'INTERVAL',    distPct: 0.20, pace: paces.interval, label: 'Interval training' },
    { day: 3, type: 'EASY_RUN',    distPct: 0.15, pace: paces.easy,    label: 'Easy run' },
    { day: 4, type: 'TEMPO',       distPct: 0.18, pace: paces.tempo,   label: 'Tempo run' },
    { day: 5, type: 'CROSS_TRAIN', distPct: 0,    pace: null,          label: 'Cross-training' },
    { day: 6, type: 'LONG_RUN',    distPct: 0.30, pace: paces.longRun, label: 'Long run' },
    { day: 7, type: 'EASY_RUN',    distPct: 0.17, pace: paces.easy,    label: 'Easy recovery run' },
  ];

  // Phase-specific adjustments
  if (phase === 'base') {
    const intervalDay = dayConfigs.find(d => d.type === 'INTERVAL');
    if (intervalDay) {
      intervalDay.type = 'EASY_RUN';
      intervalDay.pace = paces.easy;
      intervalDay.label = 'Easy run (base phase)';
    }
  }

  if (phase === 'taper') {
    const longDay = dayConfigs.find(d => d.type === 'LONG_RUN');
    if (longDay) {
      longDay.distPct = 0.20;
      longDay.label = 'Reduced long run (taper)';
    }
  }

  const maxLongRunKm = goalDistance * 0.6;

  return dayConfigs.map(cfg => {
    let distance = cfg.distPct > 0 ? Math.round(weeklyKm * cfg.distPct * 10) / 10 : null;

    if (cfg.type === 'LONG_RUN' && distance && distance > maxLongRunKm) {
      distance = Math.round(maxLongRunKm * 10) / 10;
    }

    const duration = distance && cfg.pace ? Math.round(distance * cfg.pace * 10) / 10 : null;

    let description = cfg.label;
    if (isRecovery && cfg.distPct > 0) {
      description += ' (recovery week)';
    }

    return {
      weekNumber,
      dayOfWeek: cfg.day,
      activityType: cfg.type as any,
      targetDistanceKm: distance,
      targetPaceMinPerKm: cfg.pace,
      targetDurationMin: duration,
      description,
      scheduledDate: null, // no longer rely on scheduledDate
    };
  });
}
