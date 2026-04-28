import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useRunnerAuthStore } from '../store/runnerAuthStore';
import '../styles/running-coach.css';

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 6,
        size: 2 + Math.random() * 3,
        opacity: 0.2 + Math.random() * 0.4,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#00FF88]"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            opacity: 0,
            animation: `float-up ${p.duration}s ${p.delay}s ease-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

function RunnerHero() {
  return (
    <div className="relative flex items-center justify-center mb-4">
      {/* Pulse rings */}
      <div className="absolute w-32 h-32 rounded-full border border-[#00FF88]/20" style={{ animation: 'pulse-ring 3s ease-out infinite' }} />
      <div className="absolute w-32 h-32 rounded-full border border-[#00FF88]/15" style={{ animation: 'pulse-ring 3s ease-out 1s infinite' }} />
      <div className="absolute w-32 h-32 rounded-full border border-[#00FF88]/10" style={{ animation: 'pulse-ring 3s ease-out 2s infinite' }} />

      {/* Neon-outlined runner */}
      <div style={{ animation: 'runner-breathe 3s ease-in-out infinite' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="neonGrad" x1="30" y1="10" x2="90" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00FF88" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#neonGlow)">
            {/* Head */}
            <circle cx="70" cy="16" r="8" fill="url(#neonGrad)" />
            {/* Body - full running silhouette as single filled shape */}
            <path
              d="M68 24 C68 24 72 24 73 26 L76 34 L82 28 L86 18 L90 19 L84 32 L78 38 L74 38
                 L70 48 L68 56
                 L76 64 L88 70 L92 68 L96 70 L92 74 L86 74 L68 60
                 L64 68 L56 80 L50 86 L46 84 L56 74 L62 62
                 L60 56 L56 38 L48 44 L40 54 L36 52 L46 40 L56 32
                 L64 26 Z"
              fill="url(#neonGrad)"
              opacity="0.9"
            />
            {/* Speed lines */}
            <line x1="30" y1="32" x2="16" y2="32" stroke="#00FF88" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
            <line x1="26" y1="44" x2="10" y2="44" stroke="#00FF88" strokeWidth="2.5" opacity="0.35" strokeLinecap="round" />
            <line x1="28" y1="56" x2="14" y2="56" stroke="#00FF88" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function RunnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useRunnerAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/runningCoach/dashboard', { replace: true });
    } catch {
      // Error displayed from store
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_bottom,_rgba(0,255,136,0.06)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,212,255,0.04)_0%,_transparent_50%)]" />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Horizon glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div
          className="h-full bg-gradient-to-r from-transparent via-[#00FF88] to-transparent"
          style={{ animation: 'horizon-pulse 4s ease-in-out infinite' }}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#00FF88]/[0.03] to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-6" style={{ animation: 'slide-up 0.6s ease-out' }}>
        {/* Runner hero */}
        <RunnerHero />

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-white">Running</span>{' '}
            <span className="text-[#00FF88] neon-glow-green">Coach</span>
          </h1>
          <p className="text-[#B0B0B0] text-sm mt-2 tracking-wide">Your AI-powered running companion</p>
        </div>

        {/* Login card */}
        <div className="bg-[#1E1E2E]/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#B0B0B0] mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0D0D0D]/80 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-[#00FF88]/50 focus:shadow-[0_0_0_1px_rgba(0,255,136,0.15)] focus:outline-none transition-all text-sm"
                placeholder="runner@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B0B0B0] mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0D0D0D]/80 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-[#00FF88]/50 focus:shadow-[0_0_0_1px_rgba(0,255,136,0.15)] focus:outline-none transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="rc-btn w-full login-btn-shimmer text-black font-bold py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 text-base neon-glow-green-box mt-2"
            >
              <Zap size={18} strokeWidth={2.5} />
              {isLoading ? 'Logging in...' : 'Start Running'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <p className="text-center text-[#B0B0B0] text-sm">
              New runner?{' '}
              <Link to="/runningCoach/register" className="text-[#00D4FF] hover:text-[#00D4FF]/80 font-semibold transition-colors">
                Join the race →
              </Link>
            </p>
          </div>
        </div>

        {/* Trust text */}
        <p className="text-center text-white/20 text-xs mt-6 tracking-wide">
          Powered by Jack Daniels VDOT methodology
        </p>
      </div>
    </div>
  );
}
