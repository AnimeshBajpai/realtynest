import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Sparkles, Target, User, Activity, Zap, Flame, Trophy, Calendar } from 'lucide-react';
import { runnerApi } from '../lib/api';
import { useRunnerAuthStore } from '../store/runnerAuthStore';
import type { OnboardingData } from '../types/runner.types';
import '../styles/running-coach.css';

const EXPERIENCE_LEVELS = [
  { value: 'beginner', icon: Zap, label: 'Beginner', desc: 'New to running or just getting started' },
  { value: 'intermediate', icon: Activity, label: 'Intermediate', desc: '1-2 years of regular running' },
  { value: 'advanced', icon: Flame, label: 'Advanced', desc: '3+ years, consistent training' },
  { value: 'elite', icon: Trophy, label: 'Elite', desc: 'Competitive runner, race veteran' },
];

const GOAL_TYPES = [
  { value: 'distance', icon: Activity, label: 'Distance Goal', desc: 'Run a target distance (5K, 10K, etc.)', color: '#00FF88' },
  { value: 'time', icon: Target, label: 'Time Goal', desc: 'Finish in a target time', color: '#00D4FF' },
  { value: 'race', icon: Trophy, label: 'Race Prep', desc: 'Train for an upcoming race', color: '#FF6B35' },
  { value: 'consistency', icon: Calendar, label: 'Build Habit', desc: 'Run regularly and stay consistent', color: '#FFD93D' },
];

const INPUT_CLASS =
  'w-full bg-[#0D0D0D]/80 border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:border-[#00FF88]/50 focus:shadow-[0_0_0_1px_rgba(0,255,136,0.15)] focus:outline-none transition-all text-sm';

const INPUT_CLASS_ORANGE =
  'w-full bg-[#0D0D0D]/80 border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:border-[#FF6B35]/50 focus:shadow-[0_0_0_1px_rgba(255,107,53,0.15)] focus:outline-none transition-all text-sm';

export default function RunnerOnboardingPage() {
  const navigate = useNavigate();
  const { getMe } = useRunnerAuthStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    experienceLevel: '',
    goalType: '',
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleGenerate = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        experienceLevel: data.experienceLevel?.toUpperCase(),
        age: data.age || 25,
        currentWeeklyKm: data.currentWeeklyKm || 0,
        currentPaceMinPerKm: data.currentPaceMinPerKm || 7,
        fitnessLevel: data.experienceLevel === 'elite' ? 8 : data.experienceLevel === 'advanced' ? 6 : data.experienceLevel === 'intermediate' ? 4 : 2,
      };
      await runnerApi.put('/profile/onboarding', payload);
      await getMe();
      navigate('/runningCoach/dashboard', { replace: true });
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_bottom,_rgba(0,255,136,0.04)_0%,_transparent_60%)]" />

      {/* Progress bar */}
      <div className="relative z-10 w-full h-1 bg-[#1A1A2E]">
        <div
          className="h-full bg-gradient-to-r from-[#00FF88] to-[#00D4FF] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Step indicator dots */}
          <div className="flex items-center justify-center gap-3 mb-10">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="relative">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i + 1 === step
                      ? 'bg-[#00FF88] scale-125'
                      : i + 1 < step
                        ? 'bg-[#00FF88]/60'
                        : 'bg-white/15'
                  }`}
                />
                {i + 1 === step && (
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#00FF88]/30 animate-ping" />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic details */}
          {step === 1 && (
            <div className="space-y-6" style={{ animation: 'slide-up 0.4s ease-out' }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 mb-4">
                  <User className="text-[#00D4FF]" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white">About You</h2>
                <p className="text-[#B0B0B0] mt-1.5 text-sm">Let's personalize your experience</p>
              </div>

              <div className="bg-[#1E1E2E]/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-1.5 uppercase tracking-wider">Age</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={data.age || ''}
                    onChange={(e) => updateData({ age: parseInt(e.target.value) || undefined })}
                    className={INPUT_CLASS}
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-1.5 uppercase tracking-wider">Weight (kg)</label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={data.weightKg || ''}
                    onChange={(e) => updateData({ weightKg: parseFloat(e.target.value) || undefined })}
                    className={INPUT_CLASS}
                    placeholder="70"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Running experience */}
          {step === 2 && (
            <div className="space-y-6" style={{ animation: 'slide-up 0.4s ease-out' }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00FF88]/10 border border-[#00FF88]/20 mb-4">
                  <Activity className="text-[#00FF88]" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white">Your Running</h2>
                <p className="text-[#B0B0B0] mt-1.5 text-sm">Tell us about your experience</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {EXPERIENCE_LEVELS.map((level) => {
                  const Icon = level.icon;
                  const isSelected = data.experienceLevel === level.value;
                  return (
                    <button
                      key={level.value}
                      onClick={() => updateData({ experienceLevel: level.value })}
                      className={`relative p-4 rounded-xl text-left transition-all duration-200 border ${
                        isSelected
                          ? 'bg-[#00FF88]/10 border-[#00FF88]/40 shadow-[0_0_20px_rgba(0,255,136,0.1)]'
                          : 'bg-[#1E1E2E]/50 border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      <Icon
                        size={20}
                        className={`mb-2 ${isSelected ? 'text-[#00FF88]' : 'text-white/40'}`}
                      />
                      <div className={`text-sm font-semibold mb-0.5 ${isSelected ? 'text-white' : 'text-white/80'}`}>
                        {level.label}
                      </div>
                      <div className="text-xs text-[#B0B0B0]/70 leading-relaxed">{level.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#1E1E2E]/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-1.5 uppercase tracking-wider">
                    Weekly distance (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={data.currentWeeklyKm || ''}
                    onChange={(e) => updateData({ currentWeeklyKm: parseFloat(e.target.value) || undefined })}
                    className={INPUT_CLASS}
                    placeholder="15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-1.5 uppercase tracking-wider">
                    Current pace (min/km)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    step="0.1"
                    value={data.currentPaceMinPerKm || ''}
                    onChange={(e) => updateData({ currentPaceMinPerKm: parseFloat(e.target.value) || undefined })}
                    className={INPUT_CLASS}
                    placeholder="6.0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goal setting */}
          {step === 3 && (
            <div className="space-y-6" style={{ animation: 'slide-up 0.4s ease-out' }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 mb-4">
                  <Target className="text-[#FF6B35]" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white">Set Your Goal</h2>
                <p className="text-[#B0B0B0] mt-1.5 text-sm">What are you training for?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {GOAL_TYPES.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = data.goalType === goal.value;
                  return (
                    <button
                      key={goal.value}
                      onClick={() => updateData({ goalType: goal.value })}
                      className={`relative p-4 rounded-xl text-left transition-all duration-200 border ${
                        isSelected
                          ? 'border-white/20'
                          : 'bg-[#1E1E2E]/50 border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                      style={isSelected ? {
                        background: `${goal.color}10`,
                        borderColor: `${goal.color}66`,
                        boxShadow: `0 0 20px ${goal.color}15`,
                      } : undefined}
                    >
                      <Icon
                        size={20}
                        className="mb-2"
                        style={{ color: isSelected ? goal.color : 'rgba(255,255,255,0.4)' }}
                      />
                      <div className={`text-sm font-semibold mb-0.5 ${isSelected ? 'text-white' : 'text-white/80'}`}>
                        {goal.label}
                      </div>
                      <div className="text-xs text-[#B0B0B0]/70 leading-relaxed">{goal.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#1E1E2E]/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 space-y-5">
                {(data.goalType === 'time' || data.goalType === 'race') && (
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-1.5 uppercase tracking-wider">Target time</label>
                    <input
                      type="text"
                      value={data.targetTime || ''}
                      onChange={(e) => updateData({ targetTime: e.target.value })}
                      className={INPUT_CLASS_ORANGE}
                      placeholder="e.g. 25:00 for 5K"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-1.5 uppercase tracking-wider">Target date</label>
                  <input
                    type="date"
                    value={data.targetDate || ''}
                    onChange={(e) => updateData({ targetDate: e.target.value })}
                    className={INPUT_CLASS_ORANGE}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-10">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rc-btn flex items-center gap-1.5 text-[#B0B0B0] hover:text-white px-4 py-2.5 rounded-xl transition-colors text-sm"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="rc-btn login-btn-shimmer text-black font-bold px-7 py-3 rounded-xl flex items-center gap-1.5 text-sm neon-glow-green-box"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isSubmitting || !data.experienceLevel || !data.goalType}
                className="rc-btn bg-gradient-to-r from-[#00FF88] to-[#00D4FF] text-black font-bold px-7 py-3 rounded-xl disabled:opacity-40 flex items-center gap-2 text-sm neon-glow-green-box"
              >
                <Sparkles size={16} />
                {isSubmitting ? 'Generating plan...' : 'Generate My Plan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
