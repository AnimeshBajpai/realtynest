import { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
  Search,
  X,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
}

const roleBadgeColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-rose-50 text-rose-700 border border-rose-200',
  AGENCY_ADMIN: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  BROKER: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  AGENCY_ADMIN: 'Admin',
  BROKER: 'Broker',
}

interface SearchResult {
  leads: Array<{ id: string; firstName: string; lastName: string; email?: string }>
  properties: Array<{ id: string; name: string; city?: string }>
  users: Array<{ id: string; firstName: string; lastName: string; role: string }>
}

function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setOpen(false); return }
    setLoading(true)
    try {
      const { data } = await api.get<SearchResult>('/search', { params: { q } })
      setResults(data)
      setOpen(true)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    clearTimeout(timerRef.current)
    if (value.length < 2) { setResults(null); setOpen(false); return }
    timerRef.current = setTimeout(() => doSearch(value), 300)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const goTo = (path: string) => {
    setOpen(false)
    setQuery('')
    setResults(null)
    navigate(path)
  }

  const hasResults = results && (results.leads?.length || results.properties?.length || results.users?.length)

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search leads, properties..."
          className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-text placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 lg:w-72"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null); setOpen(false) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-surface shadow-xl ring-1 ring-black/5 lg:w-96">
          {loading ? (
            <div className="flex items-center justify-center py-6"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-text-secondary">No results found</div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.leads?.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">Leads</p>
                  {results.leads.map((l) => (
                    <button key={l.id} onClick={() => goTo(`/leads/${l.id}`)} className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50">
                      <Users className="h-4 w-4 shrink-0 text-text-secondary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text">{l.firstName} {l.lastName}</p>
                        {l.email && <p className="truncate text-xs text-text-secondary">{l.email}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.properties?.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">Properties</p>
                  {results.properties.map((p) => (
                    <button key={p.id} onClick={() => goTo(`/properties/${p.id}`)} className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50">
                      <Building2 className="h-4 w-4 shrink-0 text-text-secondary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text">{p.name}</p>
                        {p.city && <p className="truncate text-xs text-text-secondary">{p.city}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.users?.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">Users</p>
                  {results.users.map((u) => (
                    <button key={u.id} onClick={() => goTo('/team')} className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50">
                      <UserCog className="h-4 w-4 shrink-0 text-text-secondary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text">{u.firstName} {u.lastName}</p>
                        <p className="truncate text-xs text-text-secondary">{u.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.count ?? 0)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-white transition-all duration-300 ease-in-out lg:relative lg:z-auto',
          sidebarOpen ? 'w-60' : 'w-[68px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.08] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold tracking-tight">RealtyNest</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {sidebarOpen && (
            <p className="mb-2 px-5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Menu
            </p>
          )}
          <ul className="space-y-0.5 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'border-l-[3px] border-indigo-400 bg-white/[0.08] text-white'
                        : 'border-l-[3px] border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white'
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/[0.08] p-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:block"
            >
              <Menu className="h-5 w-5" />
            </button>
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { navigate('/notifications'); fetchUnreadCount() }}
              className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-sm">
                {userInitials}
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-medium text-text">
                  {displayName}
                </span>
                {user?.role && (
                  <span
                    className={cn(
                      'ml-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
                      roleBadgeColors[user.role] ?? 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {roleLabels[user.role] ?? user.role}
                  </span>
                )}
              </div>
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
