import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'
import { usePropertyStore } from '../store/propertyStore'
import type { PropertyType, PropertyStatus } from '../types'
import { ButtonLoader } from './BrandLoader'
import AutocompleteInput from './AutocompleteInput'
import PlacesAutocomplete from './PlacesAutocomplete'
import { INDIAN_STATES, ALL_CITIES, getCitiesForState } from '../data/indianLocations'

interface Props {
  open: boolean
  onClose: () => void
}

const TYPES: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'PLOT', label: 'Plot' },
  { value: 'COMMERCIAL', label: 'Commercial' },
]

const STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'RESERVED', label: 'Reserved' },
]

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-text placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

export default function CreatePropertyModal({ open, onClose }: Props) {
  const { createProperty } = usePropertyStore()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    type: 'APARTMENT' as PropertyType,
    address: '',
    city: '',
    state: '',
    zip: '',
    price: '',
    areaSqft: '',
    bedrooms: '',
    bathrooms: '',
    status: 'AVAILABLE' as PropertyStatus,
    description: '',
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  if (!open) return null

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Property name is required'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setError(null)
    try {
      await createProperty({
        name: form.name.trim(),
        type: form.type,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        zip: form.zip.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        areaSqft: form.areaSqft ? Number(form.areaSqft) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        status: form.status,
        description: form.description.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-[5vh]">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-text">Add New Property</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className={labelClass}>
              Property Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={cn(inputClass, validationErrors.name && 'border-danger')}
              placeholder="e.g. Sunrise Apartments"
            />
            {validationErrors.name && (
              <p className="mt-1 text-xs text-danger">{validationErrors.name}</p>
            )}
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className={inputClass}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelClass}>Address</label>
            <PlacesAutocomplete
              value={form.address}
              onChange={(v) => set('address', v)}
              onPlaceSelect={(place) => {
                setForm(prev => ({
                  ...prev,
                  address: place.address,
                  city: place.city,
                  state: place.state,
                  zip: place.zip,
                }))
              }}
              placeholder="Start typing an address..."
            />
          </div>

          {/* State, City, Zip */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>State</label>
              <AutocompleteInput
                value={form.state}
                onChange={(v) => {
                  setForm(prev => ({ ...prev, state: v, city: '' }))
                  setValidationErrors(prev => { const n = { ...prev }; delete n.state; return n })
                }}
                items={[...INDIAN_STATES]}
                placeholder="State"
              />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <AutocompleteInput
                value={form.city}
                onChange={(v) => set('city', v)}
                items={form.state ? getCitiesForState(form.state) : ALL_CITIES}
                placeholder="City"
              />
            </div>
            <div>
              <label className={labelClass}>Zip</label>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => set('zip', e.target.value)}
                className={inputClass}
                placeholder="Zip code"
              />
            </div>
          </div>

          {/* Price + Area */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Price (₹)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className={inputClass}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className={labelClass}>Area (sq ft)</label>
              <input
                type="number"
                value={form.areaSqft}
                onChange={(e) => set('areaSqft', e.target.value)}
                className={inputClass}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Bedrooms + Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Bedrooms</label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => set('bedrooms', e.target.value)}
                className={inputClass}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className={labelClass}>Bathrooms</label>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) => set('bathrooms', e.target.value)}
                className={inputClass}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className={cn(inputClass, 'min-h-[80px] resize-y')}
              placeholder="Property description..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting && <ButtonLoader />}
              Create Property
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
