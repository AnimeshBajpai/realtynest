import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  X,
  CheckSquare,
  Square,
  Trash2,
  Minus,
  MessageCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../lib/utils'
import { useLeadStore, type LeadFilters } from '../store/leadStore'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import type { LeadStatus, LeadSource, LeadPriority } from '../types'
import CreateLeadModal from '../components/CreateLeadModal'
import { generateWhatsAppLinkFromRow } from '../lib/whatsapp'

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

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-text transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

export default function LeadsPage() {
  const navigate = useNavigate()
  const {
    leads,
    isLoading,
    error,
    page,
    totalPages,
    total,
    filters,
    fetchLeads,
    setFilters,
    clearFilters,
    setPage,
  } = useLeadStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'AGENCY_ADMIN'
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; firstName: string; lastName: string; role: string }>>([])
  const { assignLead } = useLeadStore()

  // Bulk selection state
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      api.get('/users').then(({ data }) => {
        const users = Array.isArray(data) ? data : data.users ?? []
        setTeamMembers(users)
      }).catch(() => {})
    }
  }, [isAdmin])

  const handleAssign = async (leadId: string, userId: string) => {
    await assignLead(leadId, userId)
    fetchLeads()
  }

  // Clear selection when leads change (page change, filter change, etc.)
  useEffect(() => {
    setSelectedLeads(new Set())
    setSelectAll(false)
  }, [leads])

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads(new Set())
      setSelectAll(false)
    } else {
      setSelectedLeads(new Set(leads.map((l) => l.id)))
      setSelectAll(true)
    }
  }

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev)
      if (next.has(leadId)) {
        next.delete(leadId)
      } else {
        next.add(leadId)
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedLeads(new Set())
    setSelectAll(false)
  }

  const handleBulkAssign = async (assignedToId: string) => {
    if (!assignedToId || selectedLeads.size === 0) return
    setBulkLoading(true)
    try {
      await api.post('/leads/bulk/assign', {
        leadIds: Array.from(selectedLeads),
        assignedToId,
      })
      clearSelection()
      fetchLeads()
    } catch {
      // error handled by interceptor
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkStatus = async (status: string) => {
    if (!status || selectedLeads.size === 0) return
    setBulkLoading(true)
    try {
      await api.post('/leads/bulk/status', {
        leadIds: Array.from(selectedLeads),
        status,
      })
      clearSelection()
      fetchLeads()
    } catch {
      // error handled by interceptor
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return
    if (!window.confirm(`Are you sure you want to delete ${selectedLeads.size} lead(s)? This action cannot be undone.`)) return
    setBulkLoading(true)
    try {
      await api.post('/leads/bulk/delete', {
        leadIds: Array.from(selectedLeads),
      })
      clearSelection()
      fetchLeads()
    } catch {
      // error handled by interceptor
    } finally {
      setBulkLoading(false)
    }
  }

  const load = useCallback(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    load()
  }, [load, page, filters])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search ?? '')) {
        setFilters({ ...filters, search: searchInput || undefined })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key: keyof LeadFilters, value: string) => {
    setFilters({ ...filters, [key]: value || undefined })
  }

  const hasActiveFilters =
    filters.status || filters.source || filters.priority || filters.search

  const formatStatusLabel = (s: LeadStatus) =>
    STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s

  const formatSourceLabel = (s: LeadSource) =>
    SOURCE_OPTIONS.find((o) => o.value === s)?.label ?? s

  return (
    <div className={selectedLeads.size > 0 ? 'pb-24' : ''}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Leads</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total} total lead{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={cn(selectClass, 'w-full pl-9')}
          />
        </div>
        <select
          value={filters.status ?? ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className={selectClass}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={filters.source ?? ''}
          onChange={(e) => handleFilterChange('source', e.target.value)}
          className={selectClass}
        >
          <option value="">All Sources</option>
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={filters.priority ?? ''}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className={selectClass}
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => {
              clearFilters()
              setSearchInput('')
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-slate-50 hover:text-text"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <div className="rounded-2xl bg-slate-100 p-4">
              <Users className="h-10 w-10 text-slate-400" />
            </div>
            <p className="mt-4 text-lg font-medium text-text">No leads found</p>
            <p className="mt-1 text-sm">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Add your first lead to get started'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                {isAdmin && (
                  <th className="bg-slate-50/80 px-4 py-3.5 w-10">
                    <button onClick={toggleSelectAll} className="flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                      {selectAll ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : selectedLeads.size > 0 ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                <th className="hidden bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">
                  Email
                </th>
                <th className="hidden bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 lg:table-cell">
                  Phone
                </th>
                <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Source</th>
                <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                <th className="hidden bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:table-cell">
                  Assigned To
                </th>
                <th className="hidden bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                  Created
                </th>
                <th className="bg-slate-50/80 px-4 py-3.5 w-10">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-slate-50',
                    selectedLeads.has(lead.id) && 'bg-indigo-50/50'
                  )}
                >
                  {isAdmin && (
                    <td className="px-4 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleSelectLead(lead.id)} className="flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                        {selectedLeads.has(lead.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3.5 font-medium text-text">{lead.firstName} {lead.lastName}</td>
                  <td className="hidden px-4 py-3.5 text-text-secondary md:table-cell">{lead.email || '—'}</td>
                  <td className="hidden px-4 py-3.5 text-text-secondary lg:table-cell">{lead.phone || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">{formatSourceLabel(lead.source)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusColors[lead.status]
                      )}
                    >
                      {formatStatusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        priorityColors[lead.priority]
                      )}
                    >
                      {lead.priority}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3.5 xl:table-cell" onClick={(e) => e.stopPropagation()}>
                    {isAdmin ? (
                      <div className="relative">
                        <select
                          value={lead.assignedToId ?? ''}
                          onChange={(e) => {
                            if (e.target.value) handleAssign(lead.id, e.target.value)
                          }}
                          className={cn(
                            'w-full max-w-[160px] cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                            lead.assignedTo
                              ? 'border-slate-200 bg-white text-text'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          )}
                        >
                          <option value="">— Assign —</option>
                          {teamMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.firstName} {m.lastName} {m.role === 'AGENCY_ADMIN' ? '(Admin)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-text-secondary">
                        {lead.assignedTo
                          ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                          : '—'}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3.5 text-text-secondary sm:table-cell">
                    {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        const url = generateWhatsAppLinkFromRow(lead, currentUser?.agency?.name ?? 'RealtyNest')
                        window.open(url, '_blank')
                      }}
                      title="Share on WhatsApp"
                      className="rounded-lg p-1.5 text-green-500 transition-colors hover:bg-green-50 hover:text-green-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPage(page - 1)
              }}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                    page === pageNum
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text hover:bg-slate-100'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => {
                setPage(page + 1)
              }}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      <CreateLeadModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Floating Bulk Action Bar */}
      {isAdmin && selectedLeads.size > 0 && (
        <div className="fixed bottom-4 left-2 right-2 z-40 mx-auto max-w-xl overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
          <div className="flex items-center gap-3 min-w-max">
            <span className="text-sm font-semibold text-text whitespace-nowrap">
              {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
            </span>

            <div className="h-5 w-px bg-slate-200" />

            <select
              disabled={bulkLoading}
              defaultValue=""
              onChange={(e) => {
                handleBulkAssign(e.target.value)
                e.target.value = ''
              }}
              className={cn(selectClass, 'text-xs py-1.5')}
            >
              <option value="" disabled>Assign To</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>

            <select
              disabled={bulkLoading}
              defaultValue=""
              onChange={(e) => {
                handleBulkStatus(e.target.value)
                e.target.value = ''
              }}
              className={cn(selectClass, 'text-xs py-1.5')}
            >
              <option value="" disabled>Change Status</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <button
              disabled={bulkLoading}
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>

            <button
              disabled={bulkLoading}
              onClick={clearSelection}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>

            {bulkLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
        </div>
      )}
    </div>
  )
}
