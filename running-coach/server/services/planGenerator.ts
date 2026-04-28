import type { ActivityType } from 'generated-prisma-client';

interface RunnerInput {
  currentPaceMinPerKm: number | null;
  experienceLevel: string;
  currentWeeklyKm: number | null;
}

interface GoalInput {
  goalType: string;
  targetDistanceKm: number | null;
  targetTimeMinutes: number | null;
  targetDate: Date | null;
}

interface PlanItem {
  weekNumber: number;
  dayOfWeek: number;
  activityType: ActivityType;
  targetDistanceKm: number | null;
  targetPaceMinPerKm: number | null;
  targetDurationMin: number | null;
  description: string;
  scheduledDate: Date | null;
}

// Goal type to distance map (km)
const GOAL_DISTANCES: Record<string, number> = {
  FIVE_K: 5,
  TEN_K: 10,
  HALF_MARATHON: 21.1,
  FULL_MARATHON: 42.2,
};

/**
 * Calculate training paces using simplified Jack Daniels VDOT methodology.
 * Paces are in minutes per km.
 */
function calculatePaces(currentPace: number) {
  return {
    easy: currentPace + 1.25,    // +60-90s/km → using 75s midpoint
    tempo: currentPace + 0.45,   // +25-30s/km → using 27s midpoint
    interval: currentPace - 0.08, // at or slightly faster than 5K pace
    longRun: currentPace + 1.25,  // same as easy
  };
}

function getWeeklyDistanceMultiplier(phase: 'base' | 'build' | 'peak' | 'taper'): number {
  switch (phase) {
    case 'base': return 0.7;
    case 'build': return 0.9;
    case 'peak': return 1.0;
    case 'taper': return 0.6;
  }
}

function getPhase(weekIndex: number, totalWeeks: number): 'base' | 'build' | 'peak' | 'taper' {
  const pct = weekIndex / totalWeeks;
  if (pct < 0.33) return 'base';
  if (pct < 0.75) return 'build';
  if (pct < 0.92) return 'peak';
  return 'taper';
}

function isRecoveryWeek(weekIndex: number): boolean {
  return (weekIndex + 1) % 4 === 0;
}

/**
 * Generate a full training plan.
 * Returns array of plan items (without runnerId/goalId — those are added by the caller).
 */
export function generateTrainingPlan(runner: RunnerInput, goal: GoalInput): PlanItem[] {
  const currentPace = runner.currentPaceMinPerKm ?? 7.0; // default ~7:00/km
  const baseWeeklyKm = runner.currentWeeklyKm ?? 10;
  const paces = calculatePaces(currentPace);

  const goalDistance = GOAL_DISTANCES[goal.goalType] ?? goal.targetDistanceKm ?? 5;

  // Determine plan duration in weeks
  let totalWeeks: number;
  if (goal.targetDate) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    totalWeeks = Math.max(4, Math.min(24, Math.round(
      (goal.targetDate.getTime() - Date.now()) / msPerWeek,
    )));
  } else {
    // Default durations by goal type
    const defaultWeeks: Record<string, number> = {
      FIVE_K: 8,
      TEN_K: 10,
      HALF_MARATHON: 14,
      FULL_MARATHON: 18,
      CUSTOM: 10,
    };
    totalWeeks = defaultWeeks[goal.goalType] ?? 10;
  }

  // Target peak weekly distance (based on goal distance)
  const peakWeeklyKm = Math.max(baseWeeklyKm * 1.5, goalDistance * 1.8);

  const planItems: PlanItem[] = [];
  const planStartDate = getNextMonday();

  for (let week = 0; week < totalWeeks; week++) {
    const phase = getPhase(week, totalWeeks);
    const recovery = isRecoveryWeek(week);

    // 10% rule: progressive weekly volume
    const progressionFactor = 1 + (week * 0.1);
    const rawWeeklyKm = baseWeeklyKm * progressionFactor * getWeeklyDistanceMultiplier(phase);
    const weeklyKm = recovery ? rawWeeklyKm * 0.7 : Math.min(rawWeeklyKm, peakWeeklyKm);

    const weekItems = generateWeekPlan(
      week + 1,
      weeklyKm,
      paces,
      phase,
      recovery,
      goalDistance,
      planStartDate,
      week,
    );
    planItems.push(...weekItems);
  }

  return planItems;
}

function generateWeekPlan(
  weekNumber: number,
  weeklyKm: number,
  paces: ReturnType<typeof calculatePaces>,
  phase: string,
  recovery: boolean,
  goalDistance: number,
  planStartDate: Date,
  weekOffset: number,
): PlanItem[] {
  const items: PlanItem[] = [];

  // Day distribution (of weeklyKm):
  // Mon=Rest, Tue=Intervals(20%), Wed=Easy(15%), Thu=Tempo(18%),
  // Fri=Rest/Cross, Sat=Long(30%), Sun=Easy(17%)
  const dayConfigs: Array<{
    day: number;
    type: ActivityType;
    distPct: number;
    pace: number | null;
    label: string;
  }> = [
    { day: 1, type: 'REST',        distPct: 0,    pace: null,          label: 'Rest day' },
    { day: 2, type: 'INTERVAL',    distPct: 0.20, pace: paces.interval, label: 'Interval training' },
    { day: 3, type: 'EASY_RUN',    distPct: 0.15, pace: paces.easy,    label: 'Easy run' },
    { day: 4, type: 'TEMPO',       distPct: 0.18, pace: paces.tempo,   label: 'Tempo run' },
    { day: 5, type: 'CROSS_TRAIN', distPct: 0,    pace: null,          label: 'Rest or cross-training' },
    { day: 6, type: 'LONG_RUN',    distPct: 0.30, pace: paces.longRun, label: 'Long run' },
    { day: 7, type: 'EASY_RUN',    distPct: 0.17, pace: paces.easy,    label: 'Easy recovery run' },
  ];

  // In base phase, reduce intervals to easy runs
  if (phase === 'base') {
    const intervalDay = dayConfigs.find((d) => d.type === 'INTERVAL');
    if (intervalDay) {
      intervalDay.type = 'EASY_RUN';
      intervalDay.pace = paces.easy;
      intervalDay.label = 'Easy run (base phase)';
    }
  }

  // In taper phase, reduce long run
  if (phase === 'taper') {
    const longDay = dayConfigs.find((d) => d.type === 'LONG_RUN');
    if (longDay) {
      longDay.distPct = 0.20;
      longDay.label = 'Reduced long run (taper)';
    }
  }

  // Cap long run to ~60% of goal distance (for safety)
  const maxLongRunKm = goalDistance * 0.6;

  for (const cfg of dayConfigs) {
    const scheduledDate = new Date(planStartDate);
    scheduledDate.setDate(scheduledDate.getDate() + weekOffset * 7 + (cfg.day - 1));

    let distance = cfg.distPct > 0 ? Math.round(weeklyKm * cfg.distPct * 10) / 10 : null;

    // Cap long run distance
    if (cfg.type === 'LONG_RUN' && distance && distance > maxLongRunKm) {
      distance = Math.round(maxLongRunKm * 10) / 10;
    }

    const duration = distance && cfg.pace ? Math.round(distance * cfg.pace * 10) / 10 : null;

    let description = cfg.label;
    if (recovery && cfg.distPct > 0) {
      description += ' (recovery week — reduced volume)';
    }

    items.push({
      weekNumber,
      dayOfWeek: cfg.day,
      activityType: cfg.type,
      targetDistanceKm: distance,
      targetPaceMinPerKm: cfg.pace,
      targetDurationMin: duration,
      description,
      scheduledDate,
    });
  }

  return items;
}

function getNextMonday(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
