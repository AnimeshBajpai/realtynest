interface RunnerContext {
  name: string;
  currentStreak: number;
  longestStreak: number;
  level: number;
  lastActiveDate: Date | null;
}

interface ActivityContext {
  date: Date;
  distanceKm: number;
  durationMinutes: number;
}

interface PlanItemContext {
  activityType: string;
  targetDistanceKm: number | null;
  description: string | null;
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Early bird! 🌅';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Burning the midnight oil';
}

function daysSinceLastActivity(lastActiveDate: Date | null): number {
  if (!lastActiveDate) return Infinity;
  const now = new Date();
  return Math.floor((now.getTime() - lastActiveDate.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Generate a contextual greeting for the runner.
 */
export function getGreeting(
  runner: RunnerContext,
  lastActivity: ActivityContext | null,
  todaysPlan: PlanItemContext | null,
): string {
  const timeGreeting = getTimeOfDayGreeting();
  const firstName = runner.name.split(' ')[0];
  const parts: string[] = [`${timeGreeting}, ${firstName}! 👟`];

  // Streak context
  if (runner.currentStreak >= 7) {
    parts.push(`🔥 ${runner.currentStreak}-day streak! You're on fire!`);
  } else if (runner.currentStreak >= 3) {
    parts.push(`Nice ${runner.currentStreak}-day streak going! Keep it up!`);
  }

  // Last activity context
  const daysSince = lastActivity ? daysSinceLastActivity(lastActivity.date) : Infinity;
  if (daysSince === 0) {
    parts.push(`Already got ${lastActivity!.distanceKm.toFixed(1)}km in today — great work!`);
  } else if (daysSince === 1) {
    parts.push('Yesterday was solid. Ready for today?');
  } else if (daysSince >= 3 && daysSince < Infinity) {
    parts.push(`It's been ${daysSince} days since your last run. Let's get back out there!`);
  }

  // Today's plan
  if (todaysPlan) {
    if (todaysPlan.activityType === 'REST' || todaysPlan.activityType === 'CROSS_TRAIN') {
      parts.push("Today's a rest day — enjoy the recovery! 🧘");
    } else {
      const distStr = todaysPlan.targetDistanceKm
        ? `${todaysPlan.targetDistanceKm}km `
        : '';
      parts.push(`Today's plan: ${distStr}${todaysPlan.description ?? todaysPlan.activityType.toLowerCase().replace('_', ' ')}. You've got this! 💪`);
    }
  } else {
    parts.push("No specific plan for today — feel free to do an easy run or rest up!");
  }

  return parts.join('\n');
}

/**
 * Generate a check-in response message.
 */
export function getCheckInMessage(runner: RunnerContext, completed: boolean): string {
  const firstName = runner.name.split(' ')[0];

  if (completed) {
    const celebrations = [
      `Awesome work, ${firstName}! Another one in the books! 🎉`,
      `Crushed it, ${firstName}! Your consistency is paying off! 💪`,
      `That's what I like to see, ${firstName}! Great effort today! ⭐`,
      `${firstName}, you're building something special. Well done! 🏆`,
    ];
    return celebrations[Math.floor(Math.random() * celebrations.length)];
  }

  const encouragements = [
    `No worries, ${firstName}. Rest is part of the process. Tomorrow's a new day! 🌟`,
    `It's okay, ${firstName}! Even the pros skip a day. We'll adjust the plan. 🤝`,
    `Listen to your body, ${firstName}. Skipping one run won't derail your progress! 💙`,
  ];
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

/**
 * Generate a congratulation message after logging an activity.
 */
export function getCongratulation(
  activity: { distanceKm: number; durationMinutes: number },
  xpEarned: number,
): string {
  const pace = activity.durationMinutes / activity.distanceKm;
  const paceMin = Math.floor(pace);
  const paceSec = Math.round((pace - paceMin) * 60);

  const parts = [
    `🏃 ${activity.distanceKm.toFixed(1)}km done in ${Math.round(activity.durationMinutes)} minutes!`,
    `Pace: ${paceMin}:${paceSec.toString().padStart(2, '0')}/km`,
    `+${xpEarned} XP earned! ✨`,
  ];

  if (activity.distanceKm >= 15) {
    parts.push("That's a serious distance — respect! 🫡");
  } else if (activity.distanceKm >= 10) {
    parts.push("Double digits — impressive! 🔥");
  }

  return parts.join('\n');
}

/**
 * Generate a message explaining a plan adjustment.
 */
export function getPlanAdjustmentMessage(adjustment: {
  reason: string;
  changes: string[];
}): string {
  const parts = [
    `📋 Plan Adjustment: ${adjustment.reason}`,
    '',
    ...adjustment.changes.map((c) => `• ${c}`),
    '',
    "Your plan has been updated to keep you on track safely! 🛡️",
  ];

  return parts.join('\n');
}
