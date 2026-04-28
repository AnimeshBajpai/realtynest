import { useState, useEffect } from 'react';
import { User, Activity, Edit3, Save, LogOut, Zap, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRunnerAuthStore } from '../store/runnerAuthStore';
import { runnerApi } from '../lib/api';
import RunnerNav from '../components/RunnerNav';
import '../styles/running-coach.css';

interface GamificationStats {
  xpPoints: number;
  level: number;
  levelName: string;
  currentStreak: number;
  longestStreak: number;
  badgesEarned: number;
  totalBadges: number;
  nextLevelXP: number;
  progressPercent: number;
}

export default function ProfilePage() {
  const { runner, updateProfile, logout } = useRunnerAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(runner?.name ?? '');
  const [editAge, setEditAge] = useState(runner?.age?.toString() ?? '');
  const [editWeight, setEditWeight] = useState(runner?.weightKg?.toString() ?? '');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await runnerApi.get('/gamification/stats');
        setStats(res.data);
      } catch {
        // handle error
      }
    };
    fetchStats();
  }, []);

  const handleSave = async () => {
    try {
      await updateProfile({
        name: editName,
        age: editAge ? parseInt(editAge) : undefined,
        weightKg: editWeight ? parseFloat(editWeight) : undefined,
      });
      setIsEditing(false);
    } catch {
      // handled by store
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/runningCoach/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Profile header */}
        <div className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[#00FF88]/10 flex items-center justify-center mx-auto mb-3">
            <User size={36} className="text-[#00FF88]" />
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-white text-center focus:border-[#00FF88]/50 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  placeholder="Age"
                  className="rounded-lg px-3 py-2 text-white text-center focus:border-[#00FF88]/50 focus:outline-none"
                />
                <input
                  type="number"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  placeholder="Weight (kg)"
                  className="rounded-lg px-3 py-2 text-white text-center focus:border-[#00FF88]/50 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSave}
                className="rc-btn bg-[#00FF88] text-black font-bold px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
              >
                <Save size={16} /> Save
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white">{runner?.name}</h2>
              <p className="text-sm text-[#B0B0B0]">{runner?.email}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-[#00D4FF] text-sm flex items-center gap-1 mx-auto hover:underline"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            </>
          )}
        </div>

        {/* XP and Level */}
        {stats && (
          <div className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[#00FF88]" />
                <span className="text-sm font-bold text-[#00FF88]">{stats.levelName}</span>
              </div>
              <span className="text-xs text-[#B0B0B0]">
                {stats.xpPoints} / {stats.nextLevelXP} XP
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#0D0D0D] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00FF88] to-[#00D4FF] transition-all duration-500"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
            <div className="text-center mt-1.5">
              <span className="text-xs text-[#B0B0B0]">Level {stats.level}</span>
            </div>
          </div>
        )}

        {/* Streaks & Badges */}
        {stats && (
          <div className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1">
                  <Flame size={16} className="text-[#FF6B35]" />
                  <span className="text-2xl font-bold text-[#FF6B35]">{stats.currentStreak}</span>
                </div>
                <div className="text-xs text-[#B0B0B0] mt-1">Current Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#FFD93D]">{stats.longestStreak}</div>
                <div className="text-xs text-[#B0B0B0] mt-1">Longest Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#00D4FF]">{stats.badgesEarned}</div>
                <div className="text-xs text-[#B0B0B0] mt-1">Badges</div>
              </div>
            </div>
          </div>
        )}

        {/* Runner Details */}
        {runner && (
          <div className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl p-5">
            <h3 className="text-sm font-medium text-[#B0B0B0] mb-4 flex items-center gap-2">
              <Activity size={16} /> Runner Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[#B0B0B0] text-xs">Experience</div>
                <div className="text-white font-medium">{runner.experienceLevel || '—'}</div>
              </div>
              <div>
                <div className="text-[#B0B0B0] text-xs">Weekly Km</div>
                <div className="text-white font-medium">{runner.currentWeeklyKm || '—'}</div>
              </div>
              <div>
                <div className="text-[#B0B0B0] text-xs">Age</div>
                <div className="text-white font-medium">{runner.age || '—'}</div>
              </div>
              <div>
                <div className="text-[#B0B0B0] text-xs">Weight</div>
                <div className="text-white font-medium">{runner.weightKg ? `${runner.weightKg} kg` : '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="rc-btn w-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>

      <RunnerNav />
    </div>
  );
}
