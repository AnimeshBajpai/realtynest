import { getLevelName, getXPProgress, getXPForNextLevel } from '../lib/xpCalculator';

interface XPBarProps {
  xp: number;
  level: number;
}

export default function XPBar({ xp, level }: XPBarProps) {
  const progress = getXPProgress(xp, level);
  const nextLevelXP = getXPForNextLevel(level);
  const levelName = getLevelName(level);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-[var(--rc-neon-green)]">{levelName}</span>
        <span className="text-xs text-[var(--rc-text-muted)]">
          {xp} / {nextLevelXP} XP
        </span>
      </div>
      <div className="w-full h-3 rounded-full bg-[var(--rc-bg-secondary)] overflow-hidden">
        <div
          className="xp-bar-fill h-full rounded-full bg-gradient-to-r from-[var(--rc-neon-green)] to-[var(--rc-neon-cyan)]"
          style={{
            '--xp-from': '0%',
            '--xp-to': `${progress}%`,
          } as React.CSSProperties}
        />
      </div>
      <div className="text-center mt-1">
        <span className="text-xs text-[var(--rc-text-muted)]">Level {level}</span>
      </div>
    </div>
  );
}
