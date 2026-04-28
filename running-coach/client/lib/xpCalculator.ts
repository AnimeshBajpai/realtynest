const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];

const LEVEL_NAMES = [
  'Couch Potato',
  'Jogger',
  'Runner',
  'Strider',
  'Racer',
  'Speedster',
  'Marathoner',
  'Ultra Runner',
  'Iron Legs',
  'Legend',
];

export function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)] ?? 'Legend';
}

export function getXPForNextLevel(currentLevel: number): number {
  const nextIndex = Math.min(currentLevel + 1, LEVEL_THRESHOLDS.length - 1);
  return LEVEL_THRESHOLDS[nextIndex];
}

export function getXPProgress(xp: number, level: number): number {
  const currentThreshold = LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] ?? 0;
  const nextThreshold = getXPForNextLevel(level);
  const range = nextThreshold - currentThreshold;
  if (range <= 0) return 100;
  const progress = ((xp - currentThreshold) / range) * 100;
  return Math.max(0, Math.min(100, progress));
}

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

export { LEVEL_THRESHOLDS, LEVEL_NAMES };
