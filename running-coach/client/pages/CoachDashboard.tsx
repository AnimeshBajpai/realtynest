import { useEffect, useState } from 'react';
import { Plus, Calendar, Zap, Flame, MessageCircle, RefreshCw, X, ChevronDown } from 'lucide-react';
import { useRunnerAuthStore } from '../store/runnerAuthStore';
import { useCoachStore } from '../store/coachStore';
import { useActivityStore } from '../store/activityStore';
import ActivityLogger from '../components/ActivityLogger';
import LevelUpModal from '../components/LevelUpModal';
import RunnerNav from '../components/RunnerNav';
import '../styles/running-coach.css';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CoachDashboard() {
  const { runner, getMe } = useRunnerAuthStore();
  const { greeting, currentPlan, fetchGreeting, fetchCurrentPlan } = useCoachStore();
  const { recentActivities, lastPlanAdjustments, clearPlanAdjustments, fetchRecentActivities } = useActivityStore();
  const [showLogger, setShowLogger] = useState(false);
  const [levelUp, setLevelUp] = useState<{ level: number; xp: number } | null>(null);
  const [planUpdateBanner, setPlanUpdateBanner] = useState<string[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const formatPace = (mins: number) => {
    const m = Math.floor(mins);
    const s = Math.round((mins - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchGreeting();
    fetchCurrentPlan();
    fetchRecentActivities(5);
  }, [fetchGreeting, fetchCurrentPlan, fetchRecentActivities]);

  // Show plan adjustments from greeting API (recent adjustments from last 24h)
  useEffect(() => {
    const greetingAdj = (greeting as any)?.planAdjustments;
    if (greetingAdj && greetingAdj.length > 0) {
      setPlanUpdateBanner(greetingAdj);
    }
  }, [greeting]);

  // Show plan adjustments from a just-logged activity
  useEffect(() => {
    if (lastPlanAdjustments.length > 0) {
      setPlanUpdateBanner(lastPlanAdjustments);
    }
  }, [lastPlanAdjustments]);

  const dismissPlanBanner = () => {
    setPlanUpdateBanner([]);
    clearPlanAdjustments();
  };

  const handleActivityLogged = async (result: { xpEarned: number; levelUp: boolean; newLevel?: number; planAdjustments?: string[] }) => {
    if (result.levelUp && result.newLevel != null) {
      setLevelUp({ level: result.newLevel, xp: result.xpEarned });
    }
    setShowLogger(false);
    await getMe();
    await fetchRecentActivities(5);
    await fetchCurrentPlan();
    await fetchGreeting();
  };

  const todayDow = new Date().getDay();
  const todayIndex = todayDow === 0 ? 6 : todayDow - 1;

  // Parse greeting message
  const greetingText = typeof greeting === 'string'
    ? greeting
    : greeting?.message || greeting?.content || '';

  // Parse plan items
  const planItems = currentPlan?.activities || currentPlan?.items || [];
  const hasPlan = planItems.length > 0;

  // Check if user has activities logged today
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayActivities = recentActivities.filter(
    (a) => a.date?.slice(0, 10) === todayStr || a.createdAt?.slice(0, 10) === todayStr
  );
  const hasLoggedToday = todayActivities.length > 0;

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-20">
      {levelUp && (
        <LevelUpModal
          newLevel={levelUp.level}
          xpEarned={levelUp.xp}
          onDismiss={() => setLevelUp(null)}
        />
      )}

      <div className="max-w-lg mx-auto p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Hey, {runner?.name?.split(' ')[0] ?? 'Runner'} 👋
            </h1>
            <p className="text-sm text-[#B0B0B0]">Let's crush today's run</p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#1E1E2E] px-3 py-1.5 rounded-full">
            <Flame size={16} className="text-[#FF6B35]" />
            <span className="text-sm font-bold text-white">{runner?.currentStreak ?? 0}</span>
            <span className="text-xs text-[#B0B0B0]">day streak</span>
          </div>
        </div>

        {/* XP Bar */}
        {runner && (
          <div className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[#00FF88]" />
                <span className="text-sm font-bold text-[#00FF88]">Level {runner.level}</span>
              </div>
              <span className="text-xs text-[#B0B0B0]">{runner.xpPoints} XP</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0D0D0D] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00FF88] to-[#00D4FF] transition-all duration-500"
                style={{ width: `${Math.min((runner.xpPoints % 300) / 3, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Coach greeting */}
        {greetingText && (
          <div className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#00FF88]/15 flex items-center justify-center">
                <MessageCircle size={18} className="text-[#00FF88]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-[#00FF88] mb-1">Coach</p>
                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">{greetingText}</p>
              </div>
            </div>
          </div>
        )}

        {/* Plan adjustment notification */}
        {planUpdateBanner.length > 0 && (
          <div className="bg-gradient-to-r from-[#FF6B35]/15 to-[#00D4FF]/15 border border-[#FF6B35]/30 rounded-xl p-4 relative animate-slide-up">
            <button
              onClick={dismissPlanBanner}
              className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                <RefreshCw size={18} className="text-[#FF6B35]" />
              </div>
              <div className="flex-1 pr-4">
                <p className="text-xs font-bold text-[#FF6B35] mb-1.5 uppercase tracking-wide">
                  📋 Plan Updated
                </p>
                {planUpdateBanner.map((msg, i) => (
                  <p key={i} className="text-sm text-white/85 leading-relaxed mb-1">
                    {msg}
                  </p>
                ))}
                <p className="text-xs text-white/40 mt-2">
                  Your training plan has been adjusted based on your recent activity
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Today status */}
        {hasLoggedToday && (
          <div className="bg-[#00FF88]/10 border border-[#00FF88]/20 rounded-xl p-4 text-center">
            <p className="text-[#00FF88] font-semibold text-sm">
              ✅ You've logged {todayActivities.length} {todayActivities.length === 1 ? 'run' : 'runs'} today — nice work!
            </p>
          </div>
        )}

        {/* Quick log button */}
        <button
          onClick={() => setShowLogger(!showLogger)}
          className="rc-btn w-full bg-[#1E1E2E] border border-[#00FF88]/30 text-[#00FF88] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:border-[#00FF88]/60 transition-colors"
        >
          <Plus size={20} />
          {showLogger ? 'Close Logger' : 'Quick Log Run'}
        </button>

        {showLogger && <ActivityLogger onLogged={handleActivityLogged} />}

        {/* Weekly plan overview */}
        <div className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#B0B0B0] flex items-center gap-2">
              <Calendar size={16} /> This Week's Plan
            </h3>
            {hasPlan && currentPlan?.weekNumber && (
              <span className="text-xs bg-[#00FF88]/10 text-[#00FF88] px-2 py-0.5 rounded-full font-medium">
                Week {currentPlan.weekNumber}
              </span>
            )}
          </div>
          {hasPlan ? (
            <div className="space-y-2">
              {DAY_LABELS.map((label, i) => {
                const activity = planItems.find((a: any) => a.dayOfWeek === i + 1);
                const isToday = i === todayIndex;
                const isPast = i < todayIndex;
                const isRest = activity?.activityType === 'REST' || activity?.activityType === 'CROSS_TRAIN';
                const isCompleted = activity?.status === 'COMPLETED';

                const typeLabels: Record<string, string> = {
                  'REST': 'Rest Day',
                  'EASY_RUN': 'Easy Run',
                  'TEMPO': 'Tempo Run',
                  'INTERVAL': 'Intervals',
                  'LONG_RUN': 'Long Run',
                  'CROSS_TRAIN': 'Cross Train',
                };
                const typeColors: Record<string, string> = {
                  'REST': '#B0B0B0',
                  'EASY_RUN': '#00FF88',
                  'TEMPO': '#FF6B35',
                  'INTERVAL': '#FF61D8',
                  'LONG_RUN': '#00D4FF',
                  'CROSS_TRAIN': '#FFD93D',
                };
                const color = activity ? typeColors[activity.activityType] || '#B0B0B0' : '#B0B0B0';

                const isExpanded = expandedDay === i;
                const isRunType = ['EASY_RUN', 'TEMPO', 'INTERVAL', 'LONG_RUN'].includes(activity?.activityType || '');
                const isCrossTrain = activity?.activityType === 'CROSS_TRAIN';
                const isRestDay = activity?.activityType === 'REST';

                const runNotes: Record<string, string> = {
                  'EASY_RUN': '💡 Keep a relaxed effort — you should be able to hold a conversation easily.',
                  'TEMPO': '💡 Maintain a steady pace at your lactate threshold. Comfortably hard.',
                  'INTERVAL': '💡 Alternate between fast bursts and recovery jogs. Push hard on the fast segments!',
                  'LONG_RUN': '💡 Keep an easy, conversational pace. The goal is time on feet, not speed.',
                };

                return (
                  <div key={label}>
                    <div
                      onClick={() => activity && setExpandedDay(isExpanded ? null : i)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        activity ? 'cursor-pointer hover:bg-white/[0.03]' : ''
                      } ${
                        isToday
                          ? 'bg-[#00FF88]/8 border border-[#00FF88]/25'
                          : isPast
                            ? 'opacity-50'
                            : 'bg-[#0D0D0D]/30'
                      }`}
                    >
                      {/* Day label */}
                      <div className={`w-10 text-xs font-bold ${isToday ? 'text-[#00FF88]' : 'text-[#B0B0B0]'}`}>
                        {label}
                      </div>

                      {/* Color dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />

                      {/* Activity info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white font-medium">
                          {activity ? typeLabels[activity.activityType] || activity.activityType : 'No activity'}
                        </span>
                        {activity?.description && !isRest && !isExpanded && (
                          <span className="text-xs text-white/40 ml-2 hidden sm:inline">
                            {activity.description}
                          </span>
                        )}
                      </div>

                      {/* Distance / status */}
                      <div className="text-right flex-shrink-0">
                        {isCompleted ? (
                          <span className="text-xs text-[#00FF88] font-bold">✓ Done</span>
                        ) : isRest ? (
                          <span className="text-xs text-[#B0B0B0]">😴</span>
                        ) : activity?.targetDistanceKm ? (
                          <span className="text-sm font-bold" style={{ color }}>
                            {activity.targetDistanceKm} km
                          </span>
                        ) : (
                          <span className="text-xs text-white/20">-</span>
                        )}
                      </div>

                      {/* Chevron */}
                      {activity && (
                        <ChevronDown
                          size={16}
                          className="text-[#B0B0B0] flex-shrink-0 transition-transform duration-200"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && activity && (
                      <div
                        className="mx-3 mt-1 mb-2 px-4 py-3 rounded-lg bg-[#0D0D0D]/60 border-l-2 animate-slide-up"
                        style={{ borderLeftColor: color }}
                      >
                        {isRunType && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {activity.targetDistanceKm != null && (
                                <div className="text-xs">
                                  <span className="text-[#B0B0B0]">Distance: </span>
                                  <span className="text-white font-semibold">{activity.targetDistanceKm} km</span>
                                </div>
                              )}
                              {activity.targetPaceMinPerKm != null && (
                                <div className="text-xs">
                                  <span className="text-[#B0B0B0]">Pace: </span>
                                  <span className="text-white font-semibold">{formatPace(activity.targetPaceMinPerKm)} /km</span>
                                </div>
                              )}
                              {activity.targetDurationMin != null && (
                                <div className="text-xs">
                                  <span className="text-[#B0B0B0]">Duration: </span>
                                  <span className="text-white font-semibold">~{Math.round(activity.targetDurationMin)} min</span>
                                </div>
                              )}
                            </div>
                            {activity.description && (
                              <p className="text-xs text-white/70 leading-relaxed">{activity.description}</p>
                            )}
                            {runNotes[activity.activityType] && (
                              <p className="text-xs mt-1 leading-relaxed" style={{ color }}>
                                {runNotes[activity.activityType]}
                              </p>
                            )}
                          </div>
                        )}

                        {isCrossTrain && (
                          <div className="space-y-2">
                            <p className="text-xs text-[#B0B0B0] font-medium">Suggested activities:</p>
                            <ul className="space-y-1">
                              {['Yoga / Stretching', 'Swimming', 'Cycling', 'Strength Training (bodyweight)', 'Foam Rolling & Mobility'].map((ex) => (
                                <li key={ex} className="text-xs text-white/80 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                  {ex}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color }}>
                              Pick any activity that gives your running muscles a break while staying active.
                            </p>
                          </div>
                        )}

                        {isRestDay && (
                          <p className="text-xs text-white/70 leading-relaxed">
                            Complete rest day. Your body rebuilds and gets stronger during rest. Stay hydrated and get good sleep. 😴
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-[#B0B0B0] text-sm mb-3">No training plan yet</p>
              <p className="text-xs text-white/30">Complete onboarding and your coach will create a personalized plan</p>
            </div>
          )}
        </div>

        {/* Recent activity summary */}
        {recentActivities.length > 0 && (
          <div className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl p-5">
            <h3 className="text-sm font-medium text-[#B0B0B0] mb-3">Recent Runs</h3>
            <div className="space-y-2">
              {recentActivities.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/60 text-xs">
                    {new Date(a.date || a.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{a.distanceKm} km</span>
                    <span className="text-[#00D4FF] text-xs">{(a.avgPaceMinPerKm || 0).toFixed(1)}'/km</span>
                    <span className="text-[#00FF88] text-xs font-bold">+{a.xpEarned} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <RunnerNav />
    </div>
  );
}
