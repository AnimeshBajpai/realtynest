import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Pencil,
  Trash2,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  IndianRupee,
  Building2,
  X,
  Plus,
  Link2,
  Unlink,
} from 'lucide-react'
import { ButtonLoader, PageLoader, ActionOverlay } from '../components/BrandLoader'
import { format } from 'date-fns'
import { cn } from '../lib/utils'
import { usePropertyStore } from '../store/propertyStore'
import { useAuthStore } from '../store/authStore'
import type { Property, PropertyType, PropertyStatus, InterestLevel, LeadStatus } from '../types'
import api from '../lib/api'

const TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'PLOT', label: 'Plot' },
  { value: 'COMMERCIAL', label: 'Commercial' },
]

const STATUS_OPTIONS: { value: PropertyStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'RESERVED', label: 'Reserved' },
]

const INTEREST_OPTIONS: { value: InterestLevel; label: string }[] = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

const typeBadge: Record<PropertyType, string> = {
  APARTMENT: 'bg-blue-50 text-blue-700 border border-blue-200',
  VILLA: 'bg-purple-50 text-purple-700 border border-purple-200',
  PLOT: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  COMMERCIAL: 'bg-orange-50 text-orange-700 border border-orange-200',
}

const statusBadge: Record<PropertyStatus, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  SOLD: 'bg-rose-50 text-rose-700 border border-rose-200',
  RESERVED: 'bg-amber-50 text-amber-700 border border-amber-200',
}

const interestBadge: Record<InterestLevel, string> = {
  HIGH: 'bg-rose-50 text-rose-700 border border-rose-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border border-amber-200',
  LOW: 'bg-blue-50 text-blue-700 border border-blue-200',
}

const leadStatusColors: Record<LeadStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700 border border-blue-200',
  CONTACTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  QUALIFIED: 'bg-purple-50 text-purple-700 border border-purple-200',
  SITE_VISIT: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  NEGOTIATION: 'bg-orange-50 text-orange-700 border border-orange-200',
  CLOSED_WON: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CLOSED_LOST: 'bg-rose-50 text-rose-700 border border-rose-200',
}

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} Lac`
  return `₹${price.toLocaleString('en-IN')}`
}

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-text placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const {
    selectedProperty: property,
    propertyLeads,
    isLoading,
    error,
    fetchProperty,
    fetchPropertyLeads,
    updateProperty,
    deleteProperty,
    linkLead,
    unlinkLead,
    clearSelectedProperty,
  } = usePropertyStore()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Property>>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linking, setLinking] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const [linkForm, setLinkForm] = useState({ leadId: '', interestLevel: 'MEDIUM' as InterestLevel, notes: '' })
  const [availableLeads, setAvailableLeads] = useState<{ id: string; firstName: string; lastName: string }[]>([])

  useEffect(() => {
    if (id) {
      fetchProperty(id)
      fetchPropertyLeads(id)
    }
    return () => clearSelectedProperty()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'AGENCY_ADMIN'

  const startEditing = () => {
    if (!property) return
    setEditForm({
      name: property.name,
      type: property.type,
      address: property.address ?? '',
      city: property.city ?? '',
      state: property.state ?? '',
      zip: property.zip ?? '',
      price: property.price,
      areaSqft: property.areaSqft,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      status: property.status,
      description: property.description ?? '',
    })
    setEditing(true)
  }

  const saveEditing = async () => {
    if (!id) return
    setSavingEdit(true)
    try {
      await updateProperty(id, editForm)
      setEditing(false)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deleteProperty(id)
      navigate('/properties')
    } finally {
      setDeleting(false)
    }
  }

  const openLinkModal = async () => {
    try {
      const { data } = await api.get('/leads', { params: { limit: 100 } })
      setAvailableLeads(
        (data.leads ?? []).map((l: { id: string; firstName: string; lastName: string }) => ({
          id: l.id,
          firstName: l.firstName,
          lastName: l.lastName,
        }))
      )
    } catch {
      setAvailableLeads([])
    }
    setLinkForm({ leadId: '', interestLevel: 'MEDIUM', notes: '' })
    setLinkModalOpen(true)
  }

  const handleLink = async () => {
    if (!id || !linkForm.leadId) return
    setLinking(true)
    try {
      await linkLead(id, {
        leadId: linkForm.leadId,
        interestLevel: linkForm.interestLevel,
        notes: linkForm.notes || undefined,
      })
      setLinkModalOpen(false)
    } finally {
      setLinking(false)
    }
  }

  const handleUnlink = async (leadId: string) => {
    if (!id) return
    setUnlinkingId(leadId)
    try {
      await unlinkLead(id, leadId)
    } finally {
      setUnlinkingId(null)
    }
  }

  if (isLoading && !property) {
    return <PageLoader />
  }

  if (error && !property) {
    return (
      <div className="py-10 text-center">
        <p className="text-danger">{error}</p>
        <button
          onClick={() => navigate('/properties')}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Back to Properties
        </button>
      </div>
    )
  }

  if (!property) return null

  return (
    <div className="mx-auto max-w-4xl">
      {savingEdit && <ActionOverlay label="Saving changes..." />}
      {deleting && <ActionOverlay label="Deleting property..." />}
      {linking && <ActionOverlay label="Linking lead..." />}
      {unlinkingId && <ActionOverlay label="Unlinking lead..." />}
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
        <button
          onClick={() => navigate('/properties')}
          className="font-medium transition-colors hover:text-primary"
        >
          Properties
        </button>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-text">{property.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-text">{property.name}</h1>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', typeBadge[property.type])}>
                {property.type}
              </span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadge[property.status])}>
                {property.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Created {format(new Date(property.createdAt), 'MMM d, yyyy')}
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
            {isAdmin && (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3.5 py-2 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(property.city || property.state || property.address) && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 text-text-secondary">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Location</span>
            </div>
            <p className="mt-2 text-sm font-medium text-text">
              {[property.address, property.city, property.state, property.zip]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        )}
        {property.price != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 text-text-secondary">
              <IndianRupee className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Price</span>
            </div>
            <p className="mt-2 text-lg font-bold text-text">{formatPrice(property.price)}</p>
          </div>
        )}
        {property.areaSqft != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 text-text-secondary">
              <Ruler className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Area</span>
            </div>
            <p className="mt-2 text-lg font-bold text-text">
              {property.areaSqft.toLocaleString()} sq ft
            </p>
          </div>
        )}
        {(property.bedrooms != null || property.bathrooms != null) && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 text-text-secondary">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Rooms</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm font-medium text-text">
              {property.bedrooms != null && (
                <span className="flex items-center gap-1">
                  <BedDouble className="h-4 w-4 text-text-secondary" />
                  {property.bedrooms} bed
                </span>
              )}
              {property.bathrooms != null && (
                <span className="flex items-center gap-1">
                  <Bath className="h-4 w-4 text-text-secondary" />
                  {property.bathrooms} bath
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {property.description && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-text">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-text-secondary">{property.description}</p>
        </div>
      )}

      {/* Linked Leads */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">Linked Leads</h2>
          <button
            onClick={openLinkModal}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Link2 className="h-3.5 w-3.5" />
            Link Lead
          </button>
        </div>
        {propertyLeads.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-secondary">
            No leads linked to this property yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="hidden bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">Contact</th>
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Interest</th>
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</th>
                  <th className="bg-slate-50/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {propertyLeads.map((lp) => (
                  <tr
                    key={lp.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td
                      className="cursor-pointer px-4 py-3 font-medium text-primary hover:underline"
                      onClick={() => lp.lead && navigate(`/leads/${lp.lead.id}`)}
                    >
                      {lp.lead ? `${lp.lead.firstName} ${lp.lead.lastName}` : lp.leadId}
                    </td>
                    <td className="hidden px-4 py-3 text-text-secondary sm:table-cell">
                      {lp.lead?.email || lp.lead?.phone || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {lp.lead && (
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', leadStatusColors[lp.lead.status])}>
                          {lp.lead.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', interestBadge[lp.interestLevel])}>
                        {lp.interestLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate">
                      {lp.notes || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleUnlink(lp.leadId)}
                        disabled={unlinkingId === lp.leadId}
                        className="rounded p-1 text-text-secondary hover:bg-red-50 hover:text-danger disabled:opacity-50"
                        title="Unlink lead"
                      >
                        {unlinkingId === lp.leadId ? <ButtonLoader /> : <Unlink className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Link Lead Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-[10vh]">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-text">Link Lead to Property</h2>
              <button
                onClick={() => setLinkModalOpen(false)}
                className="rounded-lg p-1 text-text-secondary hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className={labelClass}>Lead</label>
                <select
                  value={linkForm.leadId}
                  onChange={(e) => setLinkForm((p) => ({ ...p, leadId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select a lead...</option>
                  {availableLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.firstName} {l.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Interest Level</label>
                <select
                  value={linkForm.interestLevel}
                  onChange={(e) =>
                    setLinkForm((p) => ({ ...p, interestLevel: e.target.value as InterestLevel }))
                  }
                  className={inputClass}
                >
                  {INTEREST_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <input
                  type="text"
                  value={linkForm.notes}
                  onChange={(e) => setLinkForm((p) => ({ ...p, notes: e.target.value }))}
                  className={inputClass}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLink}
                  disabled={!linkForm.leadId || linking}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {linking ? <ButtonLoader /> : <Plus className="h-4 w-4" />}
                  Link Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-[5vh]">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-text">Edit Property</h2>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg p-1 text-text-secondary hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={(editForm.name as string) ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    value={editForm.type ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, type: e.target.value as PropertyType }))
                    }
                    className={inputClass}
                  >
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={editForm.status ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, status: e.target.value as PropertyStatus }))
                    }
                    className={inputClass}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input
                  type="text"
                  value={(editForm.address as string) ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    value={(editForm.city as string) ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    type="text"
                    value={(editForm.state as string) ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, state: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Zip</label>
                  <input
                    type="text"
                    value={(editForm.zip as string) ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, zip: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.price ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        price: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className={inputClass}
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Area (sq ft)</label>
                  <input
                    type="number"
                    value={editForm.areaSqft ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        areaSqft: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className={inputClass}
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Bedrooms</label>
                  <input
                    type="number"
                    value={editForm.bedrooms ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        bedrooms: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className={inputClass}
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Bathrooms</label>
                  <input
                    type="number"
                    value={editForm.bathrooms ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        bathrooms: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className={inputClass}
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={(editForm.description as string) ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className={cn(inputClass, 'min-h-[80px] resize-y')}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditing}
                  disabled={savingEdit}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {savingEdit && <ButtonLoader />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-text">Delete Property</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Are you sure you want to delete &ldquo;{property.name}&rdquo;? This action cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && <ButtonLoader />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
