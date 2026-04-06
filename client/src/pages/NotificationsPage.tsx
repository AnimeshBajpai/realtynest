import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, Inbox, UserPlus, AlertCircle, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../lib/utils'
import api from '../lib/api'
import type { Notification } from '../types'

function NotificationIcon({ type, isRead }: { type?: string; isRead: boolean }) {
  const iconClass = 'h-4 w-4'
  const icon = (() => {
    switch (type) {
      case 'LEAD_ASSIGNED': return <UserPlus className={iconClass} />
      case 'STATUS_CHANGE': return <AlertCircle className={iconClass} />
      case 'COMMUNICATION': return <MessageSquare className={iconClass} />
      default: return <Bell className={iconClass} />
    }
  })()
  return (
    <div className={cn('mt-0.5 rounded-xl p-2.5 transition-colors', !isRead ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400')}>
      {icon}
    </div>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/notifications', { params: { page: p, limit: 20 } })
      setNotifications(data.notifications ?? data.data ?? [])
      setTotalPages(data.totalPages ?? 1)
    } catch {
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(page)
  }, [page, fetchNotifications])

  const markAsRead = async (id: string, link?: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch {
      // silent
    }
    if (link) navigate(link)
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      await api.patch('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch {
      // silent
    } finally {
      setMarkingAll(false)
    }
  }

  const hasUnread = notifications.some((n) => !n.isRead)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Notifications</h1>
          <p className="mt-1 text-sm text-text-secondary">Stay up to date with your activity.</p>
        </div>
        {hasUnread && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-text shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="py-12 text-center text-danger">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-secondary">
          <div className="rounded-2xl bg-slate-100 p-4">
            <Inbox className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-4 text-lg font-medium text-text">No notifications yet</p>
          <p className="mt-1 text-sm">We&apos;ll notify you when something important happens.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id, n.link)}
                className={cn(
                  'flex cursor-pointer items-start gap-3 px-5 py-4 transition-all duration-200 hover:bg-slate-50',
                  !n.isRead && 'bg-indigo-50/40'
                )}
              >
                <NotificationIcon type={(n as unknown as Record<string, unknown>).type as string | undefined} isRead={n.isRead} />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm text-text', !n.isRead && 'font-semibold')}>{n.title}</p>
                  {n.message && <p className="mt-0.5 text-sm text-text-secondary line-clamp-2">{n.message}</p>}
                  <p className="mt-1.5 text-xs text-text-muted">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                </div>
                {!n.isRead && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500 ring-2 ring-white" />}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-text shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-text shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
