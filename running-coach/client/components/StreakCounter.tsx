import { Flame } from 'lucide-react';

interface StreakCounterProps {
  streak: number;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
  const isHighStreak = streak >= 7;
  const flameSize = isHighStreak ? 32 : 24;

  return (
    <div className="flex items-center gap-2">
      <div className={`streak-flame ${isHighStreak ? 'text-[var(--rc-neon-orange)]' : 'text-orange-400'}`}>
        <Flame size={flameSize} fill="currentColor" />
      </div>
      <div>
        <span className="text-xl font-bold text-white">{streak}</span>
        <span className="text-sm text-[var(--rc-text-muted)] ml-1">day streak</span>
      </div>
      {isHighStreak && (
        <span className="text-xs bg-[var(--rc-neon-orange)]/20 text-[var(--rc-neon-orange)] px-2 py-0.5 rounded-full font-medium">
          🔥 On Fire!
        </span>
      )}
    </div>
  );
}
