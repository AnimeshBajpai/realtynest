import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Mail,
  Phone,
  MapPin,
  Home,
  DollarSign,
  Loader2,
  Pencil,
  Clock,
  User,
  X,
  Check,
  Plus,
  Calendar,
  MessageSquare,
  FileText,
  Trash2,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '../lib/utils'
import { useLeadStore } from '../store/leadStore'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import type { LeadStatus, LeadSource, LeadPriority, Lead, Communication, CommunicationType } from '../types'

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'SITE_VISIT', label: 'Site Visit' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'CLOSED_WON', label: 'Closed Won' },
  { value: 'CLOSED_LOST', label: 'Closed Lost' },
]

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'OTHER', label: 'Other' },
]

const PRIORITY_OPTIONS: { value: LeadPriority; label: string }[] = [
  { value: 'HOT', label: 'Hot' },
  { value: 'WARM', label: 'Warm' },
  { value: 'COLD', label: 'Cold' },
]

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

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-text placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

function formatBudget(min?: number, max?: number) {
  if (!min && !max) return null
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return `Up to ${fmt(max!)}`
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const {
    selectedLead: lead,
    timeline,
    isLoading,
    error,
    fetchLead,
    fetchTimeline,
    updateLead,
    updateLeadStatus,
    clearSelectedLead,
  } = useLeadStore()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Lead>>({})
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  // Communications state
  const [communications, setCommunications] = useState<Communication[]>([])
  const [commsLoading, setCommsLoading] = useState(false)
  const [showCommModal, setShowCommModal] = useState(false)
  const [commSubmitting, setCommSubmitting] = useState(false)
  const [commForm, setCommForm] = useState({
    type: 'CALL' as CommunicationType,
    subject: '',
    body: '',
    outcome: '',
    scheduledAt: '',
    completedAt: '',
  })

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'AGENCY_ADMIN'

  const fetchCommunications = async (leadId: string) => {
    setCommsLoading(true)
    try {
      const { data } = await api.get(`/leads/${leadId}/communications`)
      setCommunications(data.communications ?? data.data ?? [])
    } catch {
      setCommunications([])
    } finally {
      setCommsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchLead(id)
      fetchTimeline(id)
      fetchCommunications(id)
    }
    return () => clearSelectedLead()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateComm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setCommSubmitting(true)
    try {
      await api.post(`/leads/${id}/communications`, {
        type: commForm.type,
        subject: commForm.subject.trim() || undefined,
        body: commForm.body.trim() || undefined,
        outcome: commForm.outcome.trim() || undefined,
        scheduledAt: commForm.scheduledAt || undefined,
        completedAt: commForm.completedAt || undefined,
      })
      setShowCommModal(false)
      setCommForm({ type: 'CALL', subject: '', body: '', outcome: '', scheduledAt: '', completedAt: '' })
      fetchCommunications(id)
    } catch {
      // ignore
    } finally {
      setCommSubmitting(false)
    }
  }

  const handleDeleteComm = async (commId: string) => {
    if (!id) return
    try {
      await api.delete(`/leads/${id}/communications/${commId}`)
      fetchCommunications(id)
    } catch {
      // ignore
    }
  }

  const commTypeIcon = (type: CommunicationType) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />
      case 'MEETING': return <Calendar className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'SMS': return <MessageSquare className="h-4 w-4" />
      case 'NOTE': return <FileText className="h-4 w-4" />
    }
  }

  const startEditing = () => {
    if (!lead) return
    setEditForm({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      source: lead.source,
      priority: lead.priority,
      budgetMin: lead.budgetMin,
      budgetMax: lead.budgetMax,
      preferredLocation: lead.preferredLocation ?? '',
      propertyTypePreference: lead.propertyTypePreference ?? '',
      notes: lead.notes ?? '',
    })
    setEditing(true)
  }

  const cancelEditing = () => setEditing(false)

  const saveEditing = async () => {
    if (!id) return
    await updateLead(id, editForm)
    setEditing(false)
  }

  const handleStatusChange = async (status: LeadStatus) => {
    if (!id) return
    await updateLeadStatus(id, status)
    setStatusDropdownOpen(false)
  }

  if (isLoading && !lead) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !lead) {
    return (
      <div className="py-10 text-center">
        <p className="text-danger">{error}</p>
        <button
          onClick={() => navigate('/leads')}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Back to Leads
        </button>
      </div>
    )
  }

  if (!lead) return null

  const budget = formatBudget(lead.budgetMin, lead.budgetMax)
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === lead.status)?.label ?? lead.status
  const sourceLabel = SOURCE_OPTIONS.find((s) => s.value === lead.source)?.label ?? lead.source

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
        <button
          onClick={() => navigate('/leads')}
          className="font-medium transition-colors hover:text-primary"
        >
          Leads
        </button>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-text">{lead.firstName} {lead.lastName}</span>
      </nav>

      {/* Lead header */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-text">
                {lead.firstName} {lead.lastName}
              </h1>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  statusColors[lead.status]
                )}
              >
                {statusLabel}
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  priorityColors[lead.priority]
                )}
              >
                {lead.priority}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {sourceLabel}
              </span>
            </div>
            {lead.assignedTo && (
              <p className="mt-2 text-sm text-text-secondary">
                Assigned to{' '}
                <span className="font-medium text-text">
                  {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                </span>
              </p>
            )}
            <p className="mt-1 text-xs text-text-secondary">
              Created {format(new Date(lead.createdAt), 'MMM d, yyyy')} · Updated{' '}
              {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-text shadow-sm transition-colors hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-text shadow-sm transition-colors hover:bg-slate-50"
              >
                Change Status
              </button>
              {statusDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setStatusDropdownOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(opt.value)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50',
                          lead.status === opt.value
                            ? 'font-medium text-primary'
                            : 'text-text'
                        )}
                      >
                        {lead.status === opt.value && <Check className="h-3.5 w-3.5" />}
                        <span className={lead.status === opt.value ? '' : 'pl-5'}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-text">Contact Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Email</p>
                  <p className="text-sm font-medium text-text">
                    {lead.email || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Phone</p>
                  <p className="text-sm font-medium text-text">
                    {lead.phone || '—'}
                  </p>
                </div>
              </div>
              {budget && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Budget</p>
                    <p className="text-sm font-medium text-text">{budget}</p>
                  </div>
                </div>
              )}
              {lead.preferredLocation && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Preferred Location</p>
                    <p className="text-sm font-medium text-text">
                      {lead.preferredLocation}
                    </p>
                  </div>
                </div>
              )}
              {lead.propertyTypePreference && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2">
                    <Home className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Property Type</p>
                    <p className="text-sm font-medium text-text">
                      {lead.propertyTypePreference}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {lead.notes && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-text-secondary">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-text">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-text">Activity Timeline</h2>
            {timeline.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-secondary">
                No activity yet
              </p>
            ) : (
              <div className="space-y-4">
                {timeline.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className="rounded-full bg-indigo-50 p-1.5 ring-2 ring-white">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      </div>
                      <div className="mt-1 flex-1 w-px bg-slate-200" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-text">
                        <span className="font-medium">
                          {activity.user
                            ? `${activity.user.firstName} ${activity.user.lastName}`
                            : 'System'}
                        </span>{' '}
                        {activity.action}
                        {activity.oldValue && activity.newValue && (
                          <span className="text-text-secondary">
                            {' '}
                            from{' '}
                            <span className="font-medium text-text">{activity.oldValue}</span>{' '}
                            to{' '}
                            <span className="font-medium text-text">{activity.newValue}</span>
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Communications */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text">Communications</h2>
              <button
                onClick={() => setShowCommModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Communication
              </button>
            </div>
            {commsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : communications.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-secondary">
                No communications yet
              </p>
            ) : (
              <div className="space-y-3">
                {communications.map((comm) => (
                  <div
                    key={comm.id}
                    className="rounded-lg border border-slate-200 p-4 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-gray-100 p-2 text-text-secondary">
                          {commTypeIcon(comm.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                              {comm.type}
                            </span>
                            {comm.subject && (
                              <span className="text-sm font-medium text-text">{comm.subject}</span>
                            )}
                          </div>
                          {comm.body && (
                            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                              {comm.body}
                            </p>
                          )}
                          {comm.outcome && (
                            <p className="mt-1 text-xs text-text-secondary">
                              <span className="font-medium text-text">Outcome:</span> {comm.outcome}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-secondary">
                            {comm.user && (
                              <span>
                                By {comm.user.firstName} {comm.user.lastName}
                              </span>
                            )}
                            <span>
                              {formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}
                            </span>
                            {comm.scheduledAt && (
                              <span>
                                Scheduled: {format(new Date(comm.scheduledAt), 'MMM d, yyyy h:mm a')}
                              </span>
                            )}
                            {comm.completedAt && (
                              <span>
                                Completed: {format(new Date(comm.completedAt), 'MMM d, yyyy h:mm a')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {(isAdmin || comm.userId === currentUser?.id) && (
                        <button
                          onClick={() => handleDeleteComm(comm.id)}
                          className="ml-2 shrink-0 rounded p-1 text-text-secondary hover:bg-red-50 hover:text-danger"
                          title="Delete communication"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-text">Lead Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-secondary">Status</dt>
                <dd className="mt-0.5">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      statusColors[lead.status]
                    )}
                  >
                    {statusLabel}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">Priority</dt>
                <dd className="mt-0.5">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      priorityColors[lead.priority]
                    )}
                  >
                    {lead.priority}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">Source</dt>
                <dd className="mt-0.5 font-medium text-text">{sourceLabel}</dd>
              </div>
              {lead.assignedTo && (
                <div>
                  <dt className="text-text-secondary">Assigned To</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-text-secondary" />
                    <span className="font-medium text-text">
                      {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                    </span>
                  </dd>
                </div>
              )}
              {lead.createdBy && (
                <div>
                  <dt className="text-text-secondary">Created By</dt>
                  <dd className="mt-0.5 font-medium text-text">
                    {lead.createdBy.firstName} {lead.createdBy.lastName}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-text-secondary">Created</dt>
                <dd className="mt-0.5 font-medium text-text">
                  {format(new Date(lead.createdAt), 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">Updated</dt>
                <dd className="mt-0.5 font-medium text-text">
                  {format(new Date(lead.updatedAt), 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-[5vh]">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-text">Edit Lead</h2>
              <button
                onClick={cancelEditing}
                className="rounded-lg p-1 text-text-secondary hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, firstName: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={(editForm.email as string) ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={(editForm.phone as string) ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Source</label>
                  <select
                    value={editForm.source ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        source: e.target.value as LeadSource,
                      }))
                    }
                    className={inputClass}
                  >
                    {SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select
                    value={editForm.priority ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        priority: e.target.value as LeadPriority,
                      }))
                    }
                    className={inputClass}
                  >
                    {PRIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Budget Min</label>
                  <input
                    type="number"
                    value={editForm.budgetMin ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        budgetMin: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className={inputClass}
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Budget Max</label>
                  <input
                    type="number"
                    value={editForm.budgetMax ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        budgetMax: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className={inputClass}
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Preferred Location</label>
                  <input
                    type="text"
                    value={(editForm.preferredLocation as string) ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, preferredLocation: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Property Type</label>
                  <input
                    type="text"
                    value={(editForm.propertyTypePreference as string) ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        propertyTypePreference: e.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={(editForm.notes as string) ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className={cn(inputClass, 'min-h-[80px] resize-y')}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditing}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Communication Modal */}
      {showCommModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-[10vh]">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-text">Add Communication</h2>
              <button
                onClick={() => setShowCommModal(false)}
                className="rounded-lg p-1 text-text-secondary hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateComm} className="space-y-4 px-6 py-4">
              <div>
                <label className={labelClass}>Type</label>
                <select
                  value={commForm.type}
                  onChange={(e) =>
                    setCommForm((p) => ({ ...p, type: e.target.value as CommunicationType }))
                  }
                  className={inputClass}
                >
                  <option value="CALL">Call</option>
                  <option value="MEETING">Meeting</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="NOTE">Note</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Subject</label>
                <input
                  type="text"
                  value={commForm.subject}
                  onChange={(e) => setCommForm((p) => ({ ...p, subject: e.target.value }))}
                  className={inputClass}
                  placeholder="Communication subject"
                />
              </div>
              <div>
                <label className={labelClass}>Body</label>
                <textarea
                  value={commForm.body}
                  onChange={(e) => setCommForm((p) => ({ ...p, body: e.target.value }))}
                  className={cn(inputClass, 'min-h-[80px] resize-y')}
                  placeholder="Details..."
                  rows={3}
                />
              </div>
              <div>
                <label className={labelClass}>Outcome</label>
                <input
                  type="text"
                  value={commForm.outcome}
                  onChange={(e) => setCommForm((p) => ({ ...p, outcome: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. Interested, Callback requested"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Scheduled At</label>
                  <input
                    type="datetime-local"
                    value={commForm.scheduledAt}
                    onChange={(e) => setCommForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Completed At</label>
                  <input
                    type="datetime-local"
                    value={commForm.completedAt}
                    onChange={(e) => setCommForm((p) => ({ ...p, completedAt: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCommModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={commSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {commSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
