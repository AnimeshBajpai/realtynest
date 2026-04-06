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
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../lib/utils'
import { useLeadStore, type LeadFilters } from '../store/leadStore'
import type { LeadStatus, LeadSource, LeadPriority } from '../types'
import CreateLeadModal from '../components/CreateLeadModal'

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

const selectClass =
  'rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

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
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Leads</h1>
          <p className="text-sm text-text-secondary">
            {total} total lead{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
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
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-gray-100"
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
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-surface">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <Users className="mb-3 h-12 w-12 opacity-40" />
            <p className="text-lg font-medium">No leads found</p>
            <p className="mt-1 text-sm">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Add your first lead to get started'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-4 py-3 font-medium text-text-secondary">Name</th>
                <th className="hidden px-4 py-3 font-medium text-text-secondary md:table-cell">
                  Email
                </th>
                <th className="hidden px-4 py-3 font-medium text-text-secondary lg:table-cell">
                  Phone
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">Source</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Priority</th>
                <th className="hidden px-4 py-3 font-medium text-text-secondary xl:table-cell">
                  Assigned To
                </th>
                <th className="hidden px-4 py-3 font-medium text-text-secondary sm:table-cell">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
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
                  <td className="hidden px-4 py-3 text-text-secondary lg:table-cell">
                    {lead.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {formatSourceLabel(lead.source)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusColors[lead.status]
                      )}
                    >
                      {formatStatusLabel(lead.status)}
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
                  <td className="hidden px-4 py-3 text-text-secondary xl:table-cell">
                    {lead.assignedTo
                      ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                      : '—'}
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
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-40"
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
                    'h-8 w-8 rounded-lg text-sm font-medium',
                    page === pageNum
                      ? 'bg-primary text-white'
                      : 'text-text hover:bg-gray-100'
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
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      <CreateLeadModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
