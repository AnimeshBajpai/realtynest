import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  Bell,
  Settings,
  LogOut,
  Menu,
  Landmark,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
}

const roleBadgeColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-danger/10 text-danger',
  AGENCY_ADMIN: 'bg-primary/10 text-primary',
  BROKER: 'bg-success/10 text-success',
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  AGENCY_ADMIN: 'Admin',
  BROKER: 'Broker',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuthStore()

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads', path: '/leads', icon: Users },
    { label: 'Properties', path: '/properties', icon: Building2 },
    { label: 'Team', path: '/team', icon: UserCog },
    ...(user?.role === 'SUPER_ADMIN'
      ? [{ label: 'Agencies', path: '/admin/agencies', icon: Landmark }]
      : []),
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Settings },
  ]

  const userInitials= user
    ? `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'U'
    : 'U'
  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : 'User'

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#1e293b] text-white transition-all duration-300 lg:relative lg:z-auto',
          sidebarOpen ? 'w-60' : 'w-16',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <Building2 className="h-8 w-8 shrink-0 text-primary" />
          {sidebarOpen && (
            <span className="text-lg font-bold tracking-tight">RealtyNest</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-surface px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                {userInitials}
              </div>
              <span className="hidden text-sm font-medium text-text sm:block">
                {displayName}
              </span>
              {user?.role && (
                <span
                  className={cn(
                    'hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-block',
                    roleBadgeColors[user.role] ?? 'bg-gray-100 text-gray-600'
                  )}
                >
                  {roleLabels[user.role] ?? user.role}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
