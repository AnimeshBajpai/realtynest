import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserCheck, TrendingUp, BarChart3, Loader2, ArrowRight, Phone, Calendar, Mail, MessageSquare, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../lib/utils'
import { useLeadStore } from '../store/leadStore'
import api from '../lib/api'
import type { LeadStatus, LeadPriority, CommunicationType } from '../types'

const statusColors: Record<LeadStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700',
  CONTACTED: 'bg-yellow-50 text-yellow-700',
  QUALIFIED: 'bg-purple-50 text-purple-700',
  SITE_VISIT: 'bg-indigo-50 text-indigo-700',
  NEGOTIATION: 'bg-orange-50 text-orange-700',
  CLOSED_WON: 'bg-green-50 text-green-700',
  CLOSED_LOST: 'bg-red-50 text-red-700',
}

const priorityColors: Record<LeadPriority, string> = {
  HOT: 'bg-red-50 text-red-700',
  WARM: 'bg-orange-50 text-orange-700',
  COLD: 'bg-blue-50 text-blue-700',
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  SITE_VISIT: 'Site Visit',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { stats, leads, isLoading, fetchStats, fetchLeads } = useLeadStore()

  interface FollowUp {
    id: string
    leadId: string
    type: CommunicationType
    subject?: string
    scheduledAt: string
    lead?: { id: string; firstName: string; lastName: string }
  }

  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [followUpsLoading, setFollowUpsLoading] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchLeads()
    // Fetch upcoming follow-ups
    const loadFollowUps = async () => {
      setFollowUpsLoading(true)
      try {
        const { data } = await api.get('/follow-ups')
        setFollowUps(data.followUps ?? data.data ?? [])
      } catch {
        setFollowUps([])
      } finally {
        setFollowUpsLoading(false)
      }
    }
    loadFollowUps()
  }, [fetchStats, fetchLeads])

  const followUpIcon = (type: CommunicationType) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />
      case 'MEETING': return <Calendar className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'SMS': return <MessageSquare className="h-4 w-4" />
      case 'NOTE': return <FileText className="h-4 w-4" />
    }
  }

  const activeLeads = stats
    ? stats.total -
      (stats.byStatus?.CLOSED_WON ?? 0) -
      (stats.byStatus?.CLOSED_LOST ?? 0)
    : 0

  const statCards = [
    {
      label: 'Total Leads',
      value: stats ? stats.total.toLocaleString() : '—',
      icon: Users,
      color: 'bg-blue-50 text-primary',
    },
    {
      label: 'Active Leads',
      value: stats ? activeLeads.toLocaleString() : '—',
      icon: TrendingUp,
      color: 'bg-amber-50 text-warning',
    },
    {
      label: 'New This Month',
      value: stats ? stats.newThisMonth.toLocaleString() : '—',
      icon: UserCheck,
      color: 'bg-green-50 text-success',
    },
    {
      label: 'Conversion Rate',
      value: stats ? `${stats.conversionRate.toFixed(1)}%` : '—',
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Welcome back!</h1>
        <p className="text-text-secondary">
          Here&apos;s what&apos;s happening with your leads today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">
                {stat.label}
              </span>
              <div className={cn('rounded-lg p-2', stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-text">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Leads */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Recent Leads</h2>
          <button
            onClick={() => navigate('/leads')}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-surface">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-secondary">
              No leads yet. Add your first lead to get started.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-medium text-text-secondary">Name</th>
                  <th className="hidden px-4 py-3 font-medium text-text-secondary md:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Priority</th>
                  <th className="hidden px-4 py-3 font-medium text-text-secondary sm:table-cell">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 5).map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-text">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="hidden px-4 py-3 text-text-secondary md:table-cell">
                      {lead.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusColors[lead.status]
                        )}
                      >
                        {STATUS_LABELS[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          priorityColors[lead.priority]
                        )}
                      >
                        {lead.priority}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-text-secondary sm:table-cell">
                      {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upcoming Follow-ups */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Upcoming Follow-ups</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-surface">
          {followUpsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : followUps.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-secondary">
              No upcoming follow-ups
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {followUps.slice(0, 5).map((fu) => (
                <div
                  key={fu.id}
                  onClick={() => fu.lead && navigate(`/leads/${fu.lead.id ?? fu.leadId}`)}
                  className="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="rounded-lg bg-gray-100 p-2 text-text-secondary">
                    {followUpIcon(fu.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">
                      {fu.lead
                        ? `${fu.lead.firstName} ${fu.lead.lastName}`
                        : 'Unknown Lead'}
                    </p>
                    {fu.subject && (
                      <p className="text-xs text-text-secondary truncate">{fu.subject}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {fu.type}
                    </span>
                    <p className="mt-1 text-xs text-text-secondary">
                      {format(new Date(fu.scheduledAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
