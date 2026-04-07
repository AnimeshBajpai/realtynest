import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'
import { useLeadStore } from '../store/leadStore'
import api from '../lib/api'
import type { LeadSource, LeadPriority } from '../types'

interface Props {
  open: boolean
  onClose: () => void
}

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'OTHER', label: 'Other' },
]

const PRIORITIES: { value: LeadPriority; label: string }[] = [
  { value: 'HOT', label: 'Hot' },
  { value: 'WARM', label: 'Warm' },
  { value: 'COLD', label: 'Cold' },
]

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-text placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

export default function CreateLeadModal({ open, onClose }: Props) {
  const { createLead } = useLeadStore()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: 'WEBSITE' as LeadSource,
    priority: 'WARM' as LeadPriority,
    budgetMin: '',
    budgetMax: '',
    preferredLocation: '',
    propertyTypePreference: '',
    notes: '',
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  if (!open) return null

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const checkDuplicate = async (field: 'phone' | 'email', value: string) => {
    if (!value.trim()) return
    try {
      const { data } = await api.post('/leads/check-duplicate', { [field]: value.trim() })
      const dupes = data.duplicates ?? []
      if (dupes.length > 0) {
        const d = dupes[0]
        const name = `${d.firstName} ${d.lastName}`
        setDuplicateWarning(
          JSON.stringify({ field, name, id: d.id, status: d.status })
        )
      } else {
        setDuplicateWarning(null)
      }
    } catch {
      // ignore errors — non-blocking
    }
  }

  const parsedWarning = duplicateWarning ? (() => {
    try { return JSON.parse(duplicateWarning) as { field: string; name: string; id: string; status: string } }
    catch { return null }
  })() : null

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.firstName.trim()) errors.firstName = 'First name is required'
    if (!form.lastName.trim()) errors.lastName = 'Last name is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Invalid email address'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setError(null)
    try {
      await createLead({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        source: form.source,
        priority: form.priority,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        preferredLocation: form.preferredLocation.trim() || undefined,
        propertyTypePreference: form.propertyTypePreference.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-[5vh]">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-text">Add New Lead</h2>
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

          {parsedWarning && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
              <span>
                A lead with this {parsedWarning.field} already exists:{' '}
                <a
                  href={`/leads/${parsedWarning.id}`}
                  className="font-medium text-amber-900 underline hover:text-amber-700"
                >
                  {parsedWarning.name}
                </a>{' '}
                ({parsedWarning.status})
              </span>
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                First Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                className={cn(inputClass, validationErrors.firstName && 'border-danger')}
                placeholder="John"
              />
              {validationErrors.firstName && (
                <p className="mt-1 text-xs text-danger">{validationErrors.firstName}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>
                Last Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                className={cn(inputClass, validationErrors.lastName && 'border-danger')}
                placeholder="Doe"
              />
              {validationErrors.lastName && (
                <p className="mt-1 text-xs text-danger">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                onBlur={() => checkDuplicate('email', form.email)}
                className={cn(inputClass, validationErrors.email && 'border-danger')}
                placeholder="john@example.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-danger">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                onBlur={() => checkDuplicate('phone', form.phone)}
                className={inputClass}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          {/* Source + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Source</label>
              <select
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                className={inputClass}
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className={inputClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Budget Min</label>
              <input
                type="number"
                value={form.budgetMin}
                onChange={(e) => set('budgetMin', e.target.value)}
                className={inputClass}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className={labelClass}>Budget Max</label>
              <input
                type="number"
                value={form.budgetMax}
                onChange={(e) => set('budgetMax', e.target.value)}
                className={inputClass}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Location + Property Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Preferred Location</label>
              <input
                type="text"
                value={form.preferredLocation}
                onChange={(e) => set('preferredLocation', e.target.value)}
                className={inputClass}
                placeholder="e.g. Downtown"
              />
            </div>
            <div>
              <label className={labelClass}>Property Type</label>
              <input
                type="text"
                value={form.propertyTypePreference}
                onChange={(e) => set('propertyTypePreference', e.target.value)}
                className={inputClass}
                placeholder="e.g. Apartment"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={cn(inputClass, 'min-h-[80px] resize-y')}
              placeholder="Any additional notes..."
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
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
