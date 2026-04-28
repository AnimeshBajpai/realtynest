import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Trophy, User } from 'lucide-react';

const navItems = [
  { to: '/runningCoach/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/runningCoach/history', icon: History, label: 'History' },
  { to: '/runningCoach/badges', icon: Trophy, label: 'Badges' },
  { to: '/runningCoach/profile', icon: User, label: 'Profile' },
];

export default function RunnerNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--rc-bg-card)] border-t border-white/5 z-40">
      <div className="flex items-center justify-around max-w-lg mx-auto py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                isActive
                  ? 'text-[var(--rc-neon-green)]'
                  : 'text-[var(--rc-text-muted)] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={isActive ? 'neon-glow-green-box rounded-full p-1' : 'p-1'}>
                  <Icon size={22} />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
