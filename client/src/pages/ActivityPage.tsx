import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  UserPlus,
  AlertCircle,
  Pencil,
  Users,
  MessageSquare,
  Bell,
  CheckCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../lib/utils'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'
import { PageLoader } from '../components/BrandLoader'

interface ActivityLead {
  id: string
  firstName: string
  lastName: string
}

interface ActivityUser {
  id: string
  firstName: string
  lastName: string
}

interface Activity {
  id: string
  action: string
  oldValue?: string | null
  newValue?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  lead: ActivityLead
  user: ActivityUser
}

interface ActivityResponse {
  activities: Activity[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'lead_created', label: 'Lead Created' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'field_updated:*', label: 'Field Updated' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'communication_added', label: 'Communication' },
  { value: 'followup_created', label: 'Follow-up Created' },
  { value: 'followup_completed', label: 'Follow-up Completed' },
]

function getActionIcon(action: string) {
  if (action === 'lead_created') return { Icon: UserPlus, color: 'bg-green-100 text-green-600' }
  if (action === 'status_change') return { Icon: AlertCircle, color: 'bg-blue-100 text-blue-600' }
  if (action.startsWith('field_updated')) return { Icon: Pencil, color: 'bg-gray-100 text-gray-600' }
  if (action === 'assignment') return { Icon: Users, color: 'bg-indigo-100 text-indigo-600' }
  if (action === 'communication_added') return { Icon: MessageSquare, color: 'bg-purple-100 text-purple-600' }
  if (action === 'followup_created') return { Icon: Bell, color: 'bg-amber-100 text-amber-600' }
  if (action === 'followup_completed') return { Icon: CheckCircle, color: 'bg-green-100 text-green-600' }
  return { Icon: Clock, color: 'bg-gray-100 text-gray-500' }
}

function describeActivity(a: Activity): React.ReactNode {
  const userName = `${a.user.firstName} ${a.user.lastName}`
  const leadName = `${a.lead.firstName} ${a.lead.lastName}`
  const leadLink = (
    <Link to={`/leads/${a.lead.id}`} className="font-medium text-indigo-600 hover:underline">
      {leadName}
    </Link>
  )

  if (a.action === 'lead_created') {
    return <><span className="font-medium text-text">{userName}</span> created lead {leadLink}</>
  }
  if (a.action === 'status_change') {
    return (
      <>
        <span className="font-medium text-text">{userName}</span> changed status of {leadLink} from{' '}
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium">{a.oldValue}</span> to{' '}
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium">{a.newValue}</span>
      </>
    )
  }
  if (a.action.startsWith('field_updated:')) {
    const field = a.action.replace('field_updated:', '')
    return (
      <>
        <span className="font-medium text-text">{userName}</span> updated{' '}
        <span className="font-medium">{field}</span> of {leadLink}
        {a.oldValue && a.newValue && (
          <> from <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium">{a.oldValue}</span> to{' '}
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium">{a.newValue}</span></>
        )}
      </>
    )
  }
  if (a.action === 'assignment') {
    const assigneeName = (a.metadata as Record<string, string> | null)?.assignedToName ?? a.newValue
    return (
      <>
        <span className="font-medium text-text">{userName}</span> assigned {leadLink} to{' '}
        <span className="font-medium">{assigneeName}</span>
      </>
    )
  }
  if (a.action === 'communication_added') {
    return <><span className="font-medium text-text">{userName}</span> added a communication for {leadLink}</>
  }
  if (a.action === 'followup_created') {
    return <><span className="font-medium text-text">{userName}</span> created a follow-up for {leadLink}</>
  }
  if (a.action === 'followup_completed') {
    return <><span className="font-medium text-text">{userName}</span> completed a follow-up for {leadLink}</>
  }
  return <><span className="font-medium text-text">{userName}</span> performed <span className="font-medium">{a.action}</span> on {leadLink}</>
}

export default function ActivityPage() {
  const { user } = useAuthStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [filterUserId, setFilterUserId] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  // Users for dropdown
  const [teamUsers, setTeamUsers] = useState<User[]>([])

  const isAdmin = user?.role === 'AGENCY_ADMIN' || user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (isAdmin) {
      api.get<User[] | { users: User[] }>('/users')
        .then(({ data }) => setTeamUsers(Array.isArray(data) ? data : data.users ?? []))
        .catch(() => {})
    }
  }, [isAdmin])

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: 20 }
      if (filterUserId) params.userId = filterUserId
      if (filterAction) params.action = filterAction
      if (filterStartDate) params.startDate = filterStartDate
      if (filterEndDate) params.endDate = filterEndDate

      const { data } = await api.get<ActivityResponse>('/activity', { params })
      setActivities(data.activities)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch {
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [page, filterUserId, filterAction, filterStartDate, filterEndDate])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleFilterChange = () => {
    setPage(1)
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Activity</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Recent activity across your agency — {total} total entries.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Filter className="hidden h-5 w-5 text-slate-400 sm:block" />

        {isAdmin && (
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">User</label>
            <select
              value={filterUserId}
              onChange={(e) => { setFilterUserId(e.target.value); handleFilterChange() }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Users</option>
              {teamUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Action</label>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); handleFilterChange() }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {ACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Start Date</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => { setFilterStartDate(e.target.value); handleFilterChange() }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">End Date</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => { setFilterEndDate(e.target.value); handleFilterChange() }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Activity Feed */}
      {loading ? (
        <div className="mt-12 flex items-center justify-center">
          <PageLoader />
        </div>
      ) : activities.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 shadow-sm">
          <div className="rounded-2xl bg-slate-100 p-4">
            <Clock className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-4 text-lg font-medium text-text">No activity found</p>
          <p className="mt-1 text-text-secondary">
            Activity will appear here as your team works with leads.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {activities.map((activity) => {
            const { Icon, color } = getActionIcon(activity.action)
            return (
              <div
                key={activity.id}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {describeActivity(activity)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-text-secondary">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
