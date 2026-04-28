import { useEffect, useState } from 'react';
import {
  Trophy, Lock, Footprints, Play, Repeat, Heart, Award, MapPin, Map,
  Medal, Milestone, Compass, Shield, Crown, Rocket, Flame, Calendar,
  Zap, Diamond, TrendingUp, Gauge, Star, type LucideIcon,
} from 'lucide-react';
import { runnerApi } from '../lib/api';
import RunnerNav from '../components/RunnerNav';
import '../styles/running-coach.css';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  iconName: string;
  xpReward: number;
  earned: boolean;
  earnedAt: string | null;
}

const ICON_MAP: Record<string, LucideIcon> = {
  shoe: Footprints,
  footprints: Footprints,
  play: Play,
  repeat: Repeat,
  heart: Heart,
  award: Award,
  'map-pin': MapPin,
  map: Map,
  trophy: Trophy,
  medal: Medal,
  milestone: Milestone,
  compass: Compass,
  shield: Shield,
  crown: Crown,
  rocket: Rocket,
  flame: Flame,
  calendar: Calendar,
  zap: Zap,
  diamond: Diamond,
  'trending-up': TrendingUp,
  gauge: Gauge,
  star: Star,
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await runnerApi.get('/gamification/badges');
        setBadges(res.data.badges || res.data || []);
      } catch { /* handled */ } finally {
        setIsLoading(false);
      }
    };
    fetchBadges();
  }, []);

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-[#FFD93D]" size={24} />
            Badges
          </h1>
          <span className="text-sm text-[#B0B0B0]">
            {earnedCount}/{badges.length} earned
          </span>
        </div>

        {/* Progress bar */}
        {badges.length > 0 && (
          <div className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#B0B0B0]">Collection Progress</span>
              <span className="text-xs text-[#00FF88] font-bold">{Math.round((earnedCount / badges.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0D0D0D] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF6B35] transition-all duration-500"
                style={{ width: `${(earnedCount / badges.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Badge grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#1E1E2E] h-32 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : badges.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto text-white/20 mb-3" size={48} />
            <p className="text-[#B0B0B0]">No badges available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => {
              const IconComponent = ICON_MAP[badge.iconName] || Award;
              const isNew = badge.earned && badge.earnedAt &&
                (Date.now() - new Date(badge.earnedAt).getTime()) < 86400000;

              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`relative bg-[#1E1E2E] border rounded-xl p-4 text-center transition-all ${
                    badge.earned
                      ? 'border-[#FFD93D]/20 hover:border-[#FFD93D]/40'
                      : 'border-white/[0.05] opacity-40 grayscale'
                  }`}
                >
                  {isNew && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00FF88] rounded-full animate-pulse" />
                  )}
                  <div className={`flex items-center justify-center mb-2 ${
                    badge.earned ? 'text-[#FFD93D]' : 'text-white/30'
                  }`}>
                    {badge.earned ? (
                      <IconComponent size={32} />
                    ) : (
                      <Lock size={28} />
                    )}
                  </div>
                  <p className="text-xs font-medium text-white truncate">{badge.name}</p>
                  {badge.earned && (
                    <p className="text-[10px] text-[#00FF88] mt-0.5">+{badge.xpReward} XP</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-[#1E1E2E] border border-white/10 rounded-xl p-6 max-w-xs w-full mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const Icon = ICON_MAP[selectedBadge.iconName] || Award;
              return (
                <div className={`flex items-center justify-center mb-4 ${
                  selectedBadge.earned ? 'text-[#FFD93D]' : 'text-white/30'
                }`}>
                  {selectedBadge.earned ? <Icon size={56} /> : <Lock size={56} />}
                </div>
              );
            })()}
            <h3 className="text-xl font-bold text-white mb-2">{selectedBadge.name}</h3>
            <p className="text-sm text-[#B0B0B0] mb-3">{selectedBadge.description}</p>
            <p className="text-xs text-[#FFD93D] mb-3">+{selectedBadge.xpReward} XP reward</p>
            {selectedBadge.earned ? (
              <p className="text-xs text-[#00FF88]">
                ✅ Earned on {new Date(selectedBadge.earnedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-xs text-[#FF6B35]">🔒 Keep running to unlock!</p>
            )}
            <button
              onClick={() => setSelectedBadge(null)}
              className="mt-5 bg-[#0D0D0D] text-white px-6 py-2 rounded-lg text-sm border border-white/10 hover:border-white/20 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <RunnerNav />
    </div>
  );
}
