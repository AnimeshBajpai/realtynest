import { useState, useEffect } from 'react'
import { X, Loader2, Plus, Building2 } from 'lucide-react'
import { cn } from '../lib/utils'
import api from '../lib/api'

interface AgencyRow {
  id: string
  name: string
  subscriptionPlan: string
  isActive: boolean
  createdAt: string
  email?: string
}

interface CreateAgencyForm {
  agencyName: string
  adminEmail: string
  adminPassword: string
  adminFirstName: string
  adminLastName: string
  adminPhone: string
}

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-text placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<AgencyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateAgencyForm>({
    agencyName: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
    adminPhone: '',
  })

  const fetchAgencies = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/agencies')
      setAgencies(res.data.agencies)
    } catch {
      setError('Failed to load agencies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgencies()
  }, [])

  const resetForm = () => {
    setForm({
      agencyName: '',
      adminEmail: '',
      adminPassword: '',
      adminFirstName: '',
      adminLastName: '',
      adminPhone: '',
    })
    setError(null)
  }

  const openModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    resetForm()
  }

  const set = (field: keyof CreateAgencyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await api.post('/admin/agencies', {
        agencyName: form.agencyName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        adminFirstName: form.adminFirstName,
        adminLastName: form.adminLastName,
        adminPhone: form.adminPhone || undefined,
      })
      closeModal()
      fetchAgencies()
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
              ?.error?.message || 'Failed to create agency'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Agency Management</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Create and manage agencies on the platform
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Create Agency
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : agencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="mb-3 h-10 w-10 text-text-secondary/40" />
            <p className="text-sm font-medium text-text">No agencies yet</p>
            <p className="mt-1 text-sm text-text-secondary">
              Create the first agency to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Admin Email</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Plan</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agencies.map((agency) => (
                  <tr key={agency.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-text">{agency.name}</td>
                    <td className="px-6 py-4 text-text-secondary">
                      {agency.email ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                        {agency.subscriptionPlan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-medium',
                          agency.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        )}
                      >
                        {agency.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {new Date(agency.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Agency Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-[5vh]">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-text">Create Agency</h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-text-secondary hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>
              )}

              <div>
                <label className={labelClass}>
                  Agency Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.agencyName}
                  onChange={(e) => set('agencyName', e.target.value)}
                  className={inputClass}
                  placeholder="Acme Realty"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Admin First Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.adminFirstName}
                    onChange={(e) => set('adminFirstName', e.target.value)}
                    className={inputClass}
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Admin Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.adminLastName}
                    onChange={(e) => set('adminLastName', e.target.value)}
                    className={inputClass}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Admin Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.adminEmail}
                  onChange={(e) => set('adminEmail', e.target.value)}
                  className={inputClass}
                  placeholder="admin@acmerealty.com"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Admin Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.adminPassword}
                  onChange={(e) => set('adminPassword', e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className={labelClass}>Admin Phone</label>
                <input
                  type="tel"
                  value={form.adminPhone}
                  onChange={(e) => set('adminPhone', e.target.value)}
                  className={inputClass}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
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
                  Create Agency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
