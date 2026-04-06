import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, TrendingUp, BarChart3, Loader2, ArrowRight,
  Phone, Calendar, Mail, MessageSquare, FileText, Building2, Activity,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import type {
  LeadStatus, LeadPriority, CommunicationType, Lead,
  BrokerDashboard, AgencyDashboard, SuperAdminDashboard, LeadActivity,
} from '../types'

const CHART_COLORS = ['#4f46e5', '#f59e0b', '#8b5cf6', '#6366f1', '#f97316', '#10b981', '#f43f5e']

const statusColors: Record<LeadStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700 border border-blue-200',
  CONTACTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  QUALIFIED: 'bg-purple-50 text-purple-700 border border-purple-200',
  SITE_VISIT: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  NEGOTIATION: 'bg-orange-50 text-orange-700 border border-orange-200',
  CLOSED_WON: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CLOSED_LOST: 'bg-rose-50 text-rose-700 border border-rose-200',
}

const priorityColors: Record<LeadPriority, string> = {
  HOT: 'bg-rose-50 text-rose-700 border border-rose-200',
  WARM: 'bg-orange-50 text-orange-700 border border-orange-200',
  COLD: 'bg-blue-50 text-blue-700 border border-blue-200',
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  SITE_VISIT: 'Site Visit',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
}

// ─── Shared components ──────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <div className={cn('rounded-xl p-2.5', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-text">{value}</p>
    </div>
  )
}

function FollowUpsList({ followUps, loading, navigate }: {
  followUps: Array<{ id: string; leadId: string; type?: CommunicationType; subject?: string; scheduledAt: string; lead?: { id?: string; firstName: string; lastName: string } }>
  loading: boolean
  navigate: ReturnType<typeof useNavigate>
}) {
  const followUpIcon = (type?: CommunicationType) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />
      case 'MEETING': return <Calendar className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'SMS': return <MessageSquare className="h-4 w-4" />
      case 'NOTE': return <FileText className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-text">Upcoming Follow-ups</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : followUps.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-secondary">No upcoming follow-ups</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {followUps.slice(0, 5).map((fu) => (
              <div
                key={fu.id}
                onClick={() => navigate(`/leads/${fu.lead?.id ?? fu.leadId}`)}
                className="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="rounded-lg bg-gray-100 p-2 text-text-secondary">
                  {followUpIcon(fu.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">
                    {fu.lead ? `${fu.lead.firstName} ${fu.lead.lastName}` : 'Unknown Lead'}
                  </p>
                  {fu.subject && <p className="truncate text-xs text-text-secondary">{fu.subject}</p>}
                </div>
                <div className="shrink-0 text-right">
                  {fu.type && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{fu.type}</span>
                  )}
                  <p className="mt-1 text-xs text-text-secondary">{format(new Date(fu.scheduledAt), 'MMM d, h:mm a')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RecentLeadsTable({ leads, loading, navigate }: { leads: Lead[]; loading: boolean; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-text">Recent Leads</h2>
        <button onClick={() => navigate('/leads')} className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover">
          View all <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-secondary">No leads yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                <th className="hidden bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">Email</th>
                <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                <th className="hidden bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.slice(0, 5).map((lead) => (
                <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="cursor-pointer transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-medium text-text">{lead.firstName} {lead.lastName}</td>
                  <td className="hidden px-4 py-3.5 text-text-secondary md:table-cell">{lead.email || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[lead.status])}>{STATUS_LABELS[lead.status] ?? lead.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', priorityColors[lead.priority])}>{lead.priority}</span>
                  </td>
                  <td className="hidden px-4 py-3.5 text-text-secondary sm:table-cell">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Broker Dashboard ───────────────────────────────────────────

function BrokerDash() {
  const navigate = useNavigate()
  const [data, setData] = useState<BrokerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: res } = await api.get('/dashboard/broker')
        setData(res)
      } catch {
        setError('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error) return <div className="py-12 text-center text-danger">{error}</div>
  if (!data) return null

  const stats = [
    { label: 'My Leads', value: data.myLeads.total.toLocaleString(), icon: Users, color: 'bg-blue-50 text-primary' },
    { label: 'Active Leads', value: data.myLeads.active.toLocaleString(), icon: TrendingUp, color: 'bg-amber-50 text-warning' },
    { label: 'Converted', value: data.myLeads.converted.toLocaleString(), icon: UserCheck, color: 'bg-green-50 text-success' },
    { label: 'Follow-ups Due', value: (data.upcomingFollowUps?.length ?? 0).toLocaleString(), icon: Calendar, color: 'bg-purple-50 text-purple-600' },
  ]

  const statusEntries = Object.entries(data.byStatus ?? {}).map(([status, count]) => ({ status, count: count as number }))

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Leads by Status */}
      {statusEntries.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-text">My Leads by Status</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
              {statusEntries.map(({ status, count }, i) => {
                const max = Math.max(...statusEntries.map((e) => e.count), 1)
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-text-secondary">{STATUS_LABELS[status] ?? status}</span>
                    <div className="flex-1">
                      <div className="h-6 rounded-full bg-gray-100">
                        <div
                          className="flex h-6 items-center rounded-full px-2 text-xs font-medium text-white"
                          style={{ width: `${Math.max((count / max) * 100, 8)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {data.recentActivity && data.recentActivity.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-text">Recent Activity</h2>
          <div className="rounded-xl border border-gray-200 bg-surface divide-y divide-gray-100">
            {data.recentActivity.slice(0, 8).map((act: LeadActivity) => (
              <div key={act.id} onClick={() => navigate(`/leads/${act.leadId}`)} className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50">
                <div className="rounded-lg bg-gray-100 p-2 text-text-secondary"><Activity className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text">{act.action}{act.newValue ? `: ${act.newValue}` : ''}</p>
                  <p className="text-xs text-text-secondary">{act.user ? `${act.user.firstName} ${act.user.lastName}` : ''}</p>
                </div>
                <span className="shrink-0 text-xs text-text-secondary">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <FollowUpsList followUps={data.upcomingFollowUps ?? []} loading={false} navigate={navigate} />
    </div>
  )
}

// ─── Agency Admin Dashboard ─────────────────────────────────────

function AgencyAdminDash() {
  const navigate = useNavigate()
  const [data, setData] = useState<AgencyDashboard | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, leadsRes] = await Promise.all([
          api.get('/dashboard/agency'),
          api.get('/leads', { params: { limit: 5 } }),
        ])
        setData(dashRes.data)
        setLeads(leadsRes.data.leads ?? [])
      } catch {
        setError('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error) return <div className="py-12 text-center text-danger">{error}</div>
  if (!data) return null

  const stats = [
    { label: 'Total Leads', value: data.totalLeads.toLocaleString(), icon: Users, color: 'bg-blue-50 text-primary' },
    { label: 'Active Leads', value: data.activeLeads.toLocaleString(), icon: TrendingUp, color: 'bg-amber-50 text-warning' },
    { label: 'Converted', value: data.convertedLeads.toLocaleString(), icon: UserCheck, color: 'bg-green-50 text-success' },
    { label: 'Conversion Rate', value: `${data.conversionRate.toFixed(1)}%`, icon: BarChart3, color: 'bg-purple-50 text-purple-600' },
  ]

  const sourceData = Object.entries(data.bySource ?? {}).map(([name, value]) => ({ name, value: value as number }))

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        {data.pipeline && data.pipeline.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-text">Pipeline Funnel</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.pipeline.map((p) => ({ ...p, label: STATUS_LABELS[p.status] ?? p.status }))} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" width={90} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.pipeline.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Leads by Source (Donut) */}
        {sourceData.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-text">Leads by Source</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                  {sourceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Broker Performance */}
      {data.brokerPerformance && data.brokerPerformance.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-text">Broker Performance</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Broker</th>
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned</th>
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Active</th>
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Converted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.brokerPerformance.map((broker) => (
                  <tr key={broker.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-medium text-text">{broker.firstName} {broker.lastName}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{broker.assigned}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{broker.active}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{broker.converted}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RecentLeadsTable leads={leads} loading={false} navigate={navigate} />
    </div>
  )
}

// ─── Super Admin Dashboard ──────────────────────────────────────

function SuperAdminDash() {
  const [data, setData] = useState<SuperAdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: res } = await api.get('/dashboard/admin')
        setData(res)
      } catch {
        setError('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error) return <div className="py-12 text-center text-danger">{error}</div>
  if (!data) return null

  const stats = [
    { label: 'Total Agencies', value: data.totalAgencies.toLocaleString(), icon: Building2, color: 'bg-blue-50 text-primary' },
    { label: 'Total Users', value: data.totalUsers.toLocaleString(), icon: Users, color: 'bg-amber-50 text-warning' },
    { label: 'Total Leads', value: data.totalLeads.toLocaleString(), icon: UserCheck, color: 'bg-green-50 text-success' },
    { label: 'Conversion Rate', value: `${data.conversionRate.toFixed(1)}%`, icon: BarChart3, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Agencies Table */}
      {data.agencies && data.agencies.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-text">Agencies</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Leads</th>
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Users</th>
                  <th className="hidden bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.agencies.map((agency) => (
                  <tr key={agency.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-medium text-text">{agency.name}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{agency.leadCount}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{agency.userCount}</td>
                    <td className="hidden px-4 py-3.5 text-text-secondary sm:table-cell">{format(new Date(agency.createdAt), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recently Created Agencies */}
      {data.recentAgencies && data.recentAgencies.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-text">Recently Created Agencies</h2>
          <div className="rounded-xl border border-gray-200 bg-surface divide-y divide-gray-100">
            {data.recentAgencies.map((agency) => (
              <div key={agency.id} className="flex items-center gap-3 px-4 py-3">
                <div className="rounded-lg bg-blue-50 p-2 text-primary"><Building2 className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{agency.name}</p>
                </div>
                <span className="shrink-0 text-xs text-text-secondary">{formatDistanceToNow(new Date(agency.createdAt), { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard Page ────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore()
  const role = user?.role

  const greetings: Record<string, string> = {
    BROKER: "Here's your personal pipeline overview.",
    AGENCY_ADMIN: "Here's your agency overview.",
    SUPER_ADMIN: "Here's your platform overview.",
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 👋
        </h1>
        <p className="mt-1 text-text-secondary">{greetings[role ?? ''] ?? "Here's what's happening today."}</p>
      </div>

      {role === 'BROKER' && <BrokerDash />}
      {role === 'AGENCY_ADMIN' && <AgencyAdminDash />}
      {role === 'SUPER_ADMIN' && <SuperAdminDash />}
    </div>
  )
}
