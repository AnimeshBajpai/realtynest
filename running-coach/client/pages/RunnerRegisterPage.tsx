import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useRunnerAuthStore } from '../store/runnerAuthStore';
import '../styles/running-coach.css';

export default function RunnerRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error } = useRunnerAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, name);
      navigate('/runningCoach/onboarding', { replace: true });
    } catch {
      // Error displayed from store
    }
  };

  return (
    <div className="min-h-screen bg-[var(--rc-bg-primary)] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle runner animation */}
      <div className="absolute bottom-24 left-0 right-0 pointer-events-none opacity-50">
        <div className="runner-animation">
          <div className="text-[var(--rc-neon-orange)] text-3xl">🏃‍♀️</div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Join <span className="text-[var(--rc-neon-orange)]">Running Coach</span>
        </h1>
        <p className="text-[var(--rc-text-muted)]">Create your account and start training</p>
      </div>

      {/* Register card */}
      <div className="z-10 w-full max-w-md mx-4">
        <div className="bg-[var(--rc-bg-card)]/80 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-[var(--rc-text-muted)] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--rc-bg-secondary)] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-[var(--rc-neon-orange)] focus:outline-none transition-colors"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--rc-text-muted)] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--rc-bg-secondary)] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-[var(--rc-neon-orange)] focus:outline-none transition-colors"
                placeholder="runner@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--rc-text-muted)] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--rc-bg-secondary)] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-[var(--rc-neon-orange)] focus:outline-none transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="rc-btn w-full bg-[var(--rc-neon-orange)] text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 neon-glow-orange flex items-center justify-center gap-2 text-lg"
            >
              <UserPlus size={20} />
              {isLoading ? 'Creating account...' : 'Join the Race'}
            </button>
          </form>

          <p className="text-center text-[var(--rc-text-muted)] mt-6 text-sm">
            Already running?{' '}
            <Link to="/runningCoach/login" className="text-[var(--rc-neon-cyan)] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
