import { useState, useMemo } from 'react';
import { Activity, Clock, Gauge, FileText, Send, PartyPopper } from 'lucide-react';
import { useActivityStore } from '../store/activityStore';

interface ActivityLoggerProps {
  onLogged?: (result: { xpEarned: number; levelUp: boolean; newLevel?: number; planAdjustments?: string[] }) => void;
}

export default function ActivityLogger({ onLogged }: ActivityLoggerProps) {
  const { logActivity, isLogging } = useActivityStore();
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [effortLevel, setEffortLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const pace = useMemo(() => {
    const dist = parseFloat(distanceKm);
    const dur = parseFloat(durationMinutes);
    if (dist > 0 && dur > 0) {
      const paceVal = dur / dist;
      const mins = Math.floor(paceVal);
      const secs = Math.round((paceVal - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')} /km`;
    }
    return '--:-- /km';
  }, [distanceKm, durationMinutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dist = parseFloat(distanceKm);
    const dur = parseFloat(durationMinutes);
    if (!dist || !dur) return;

    try {
      const result = await logActivity({
        distanceKm: dist,
        durationMinutes: dur,
        effortLevel,
        notes: notes || undefined,
      });
      setXpEarned(result.xpEarned);
      setShowSuccess(true);
      onLogged?.(result);
      setTimeout(() => {
        setShowSuccess(false);
        setDistanceKm('');
        setDurationMinutes('');
        setEffortLevel(5);
        setNotes('');
      }, 3000);
    } catch {
      // Error handled by store
    }
  };

  if (showSuccess) {
    return (
      <div className="rc-card p-6 text-center">
        <PartyPopper className="mx-auto text-[var(--rc-gold)] mb-3" size={48} />
        <h3 className="text-xl font-bold text-white mb-2">Run Logged! 🎉</h3>
        <p className="text-[var(--rc-neon-green)] font-bold text-lg">+{xpEarned} XP</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rc-card p-6 space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Activity size={20} className="text-[var(--rc-neon-green)]" />
        Log Your Run
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--rc-text-muted)] mb-1">
            <Activity size={14} className="inline mr-1" /> Distance (km)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            className="w-full bg-[var(--rc-bg-secondary)] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[var(--rc-neon-green)] focus:outline-none"
            placeholder="5.0"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--rc-text-muted)] mb-1">
            <Clock size={14} className="inline mr-1" /> Duration (min)
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-full bg-[var(--rc-bg-secondary)] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[var(--rc-neon-green)] focus:outline-none"
            placeholder="30"
            required
          />
        </div>
      </div>

      <div className="text-center">
        <span className="text-sm text-[var(--rc-text-muted)]">Pace: </span>
        <span className="text-[var(--rc-neon-cyan)] font-mono font-bold">
          <Gauge size={14} className="inline mr-1" />
          {pace}
        </span>
      </div>

      <div>
        <label className="block text-sm text-[var(--rc-text-muted)] mb-2">
          Effort Level: <span className="text-white font-bold">{effortLevel}/10</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={effortLevel}
          onChange={(e) => setEffortLevel(parseInt(e.target.value))}
          className="w-full accent-[var(--rc-neon-green)]"
        />
        <div className="flex justify-between text-xs text-[var(--rc-text-muted)]">
          <span>Easy</span>
          <span>Max</span>
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--rc-text-muted)] mb-1">
          <FileText size={14} className="inline mr-1" /> Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-[var(--rc-bg-secondary)] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[var(--rc-neon-green)] focus:outline-none resize-none"
          rows={2}
          placeholder="How did it feel?"
        />
      </div>

      <button
        type="submit"
        disabled={isLogging}
        className="rc-btn w-full bg-[var(--rc-neon-green)] text-black font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Send size={18} />
        {isLogging ? 'Logging...' : 'Log Run'}
      </button>
    </form>
  );
}
