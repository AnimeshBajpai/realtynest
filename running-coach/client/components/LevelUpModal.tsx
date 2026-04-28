import { useEffect, useMemo } from 'react';
import { X, Star, PartyPopper } from 'lucide-react';
import { getLevelName } from '../lib/xpCalculator';

interface LevelUpModalProps {
  newLevel: number;
  xpEarned: number;
  onDismiss: () => void;
}

const CONFETTI_COLORS = ['#00FF88', '#FF6B35', '#00D4FF', '#FFD93D', '#FF61D8', '#FFFFFF'];

export default function LevelUpModal({ newLevel, xpEarned, onDismiss }: LevelUpModalProps) {
  const levelName = getLevelName(newLevel);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 4 + Math.random() * 8,
      })),
    []
  );

  useEffect(() => {
    const timeout = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Confetti */}
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute rounded-sm"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration}s ${piece.delay}s ease-in forwards`,
          }}
        />
      ))}

      {/* Modal content */}
      <div className="relative bg-[#1E1E2E] border border-white/10 rounded-xl p-8 max-w-sm w-full mx-4 text-center shadow-[0_0_30px_rgba(0,255,136,0.2)]">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-[#B0B0B0] hover:text-white"
        >
          <X size={20} />
        </button>

        <PartyPopper className="mx-auto text-[#FFD93D] mb-4" size={56} />

        <h2 className="text-3xl font-bold text-white mb-2">Level Up!</h2>

        <div className="my-6">
          <div className="inline-flex items-center gap-2 bg-[#00FF88]/10 px-6 py-3 rounded-full">
            <Star className="text-[#FFD93D]" size={24} fill="currentColor" />
            <span className="text-2xl font-bold text-[#00FF88]">
              Level {newLevel}
            </span>
          </div>
          <p className="text-xl text-[#00D4FF] mt-3 font-medium">{levelName}</p>
        </div>

        <p className="text-[#B0B0B0] mb-6">
          You earned <span className="text-[#00FF88] font-bold">+{xpEarned} XP</span>
        </p>

        <button
          onClick={onDismiss}
          className="w-full bg-[#00FF88] text-black font-bold py-3 rounded-lg hover:opacity-90"
        >
          Keep Crushing It! 💪
        </button>
      </div>
    </div>
  );
}
