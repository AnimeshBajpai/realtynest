import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
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
  APARTMENT: 'bg-blue-50 text-blue-700',
  VILLA: 'bg-purple-50 text-purple-700',
  PLOT: 'bg-green-50 text-green-700',
  COMMERCIAL: 'bg-orange-50 text-orange-700',
}

const statusBadge: Record<PropertyStatus, string> = {
  AVAILABLE: 'bg-green-50 text-green-700',
  SOLD: 'bg-red-50 text-red-700',
  RESERVED: 'bg-yellow-50 text-yellow-700',
}

const interestBadge: Record<InterestLevel, string> = {
  HIGH: 'bg-red-50 text-red-700',
  MEDIUM: 'bg-yellow-50 text-yellow-700',
  LOW: 'bg-blue-50 text-blue-700',
}

const leadStatusColors: Record<LeadStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700',
  CONTACTED: 'bg-yellow-50 text-yellow-700',
  QUALIFIED: 'bg-purple-50 text-purple-700',
  SITE_VISIT: 'bg-indigo-50 text-indigo-700',
  NEGOTIATION: 'bg-orange-50 text-orange-700',
  CLOSED_WON: 'bg-green-50 text-green-700',
  CLOSED_LOST: 'bg-red-50 text-red-700',
}

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} Lac`
  return `₹${price.toLocaleString('en-IN')}`
}

const inputClass =
  'block w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm text-text placeholder:text-text-secondary/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
const labelClass = 'block text-sm font-medium text-text-secondary mb-1'

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
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
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
    await updateProperty(id, editForm)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!id) return
    await deleteProperty(id)
    navigate('/properties')
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
    await linkLead(id, {
      leadId: linkForm.leadId,
      interestLevel: linkForm.interestLevel,
      notes: linkForm.notes || undefined,
    })
    setLinkModalOpen(false)
  }

  const handleUnlink = async (leadId: string) => {
    if (!id) return
    await unlinkLead(id, leadId)
  }

  if (isLoading && !property) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
      {/* Back button */}
      <button
        onClick={() => navigate('/properties')}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Properties
      </button>

      {/* Header */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-surface p-6">
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
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            {isAdmin && (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-danger hover:bg-red-50"
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
          <div className="rounded-xl border border-gray-200 bg-surface p-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium">Location</span>
            </div>
            <p className="mt-2 text-sm font-medium text-text">
              {[property.address, property.city, property.state, property.zip]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        )}
        {property.price != null && (
          <div className="rounded-xl border border-gray-200 bg-surface p-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <IndianRupee className="h-4 w-4" />
              <span className="text-xs font-medium">Price</span>
            </div>
            <p className="mt-2 text-lg font-bold text-text">{formatPrice(property.price)}</p>
          </div>
        )}
        {property.areaSqft != null && (
          <div className="rounded-xl border border-gray-200 bg-surface p-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Ruler className="h-4 w-4" />
              <span className="text-xs font-medium">Area</span>
            </div>
            <p className="mt-2 text-lg font-bold text-text">
              {property.areaSqft.toLocaleString()} sq ft
            </p>
          </div>
        )}
        {(property.bedrooms != null || property.bathrooms != null) && (
          <div className="rounded-xl border border-gray-200 bg-surface p-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-medium">Rooms</span>
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
        <div className="mb-6 rounded-xl border border-gray-200 bg-surface p-6">
          <h2 className="mb-3 text-base font-semibold text-text">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-text-secondary">{property.description}</p>
        </div>
      )}

      {/* Linked Leads */}
      <div className="rounded-xl border border-gray-200 bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">Linked Leads</h2>
          <button
            onClick={openLinkModal}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark"
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
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-medium text-text-secondary">Name</th>
                  <th className="hidden px-4 py-3 font-medium text-text-secondary sm:table-cell">Contact</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Interest</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Notes</th>
                  <th className="px-4 py-3 font-medium text-text-secondary" />
                </tr>
              </thead>
              <tbody>
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
                        className="rounded p-1 text-text-secondary hover:bg-red-50 hover:text-danger"
                        title="Unlink lead"
                      >
                        <Unlink className="h-4 w-4" />
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[10vh]">
          <div className="w-full max-w-md rounded-xl bg-surface shadow-xl">
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
                  disabled={!linkForm.leadId}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Link Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[5vh]">
          <div className="w-full max-w-lg rounded-xl bg-surface shadow-xl">
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
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl">
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
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
