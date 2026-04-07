import { useState, useEffect, type FormEvent } from 'react'
import {
  UserPlus,
  Shield,
  Mail,
  Phone,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  Users,
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

interface BrokerForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

const emptyBrokerForm: BrokerForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
}

export default function TeamPage() {
  const { user } = useAuthStore()
  const [brokers, setBrokers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<BrokerForm>(emptyBrokerForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const isAdmin = user?.role === 'AGENCY_ADMIN' || user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (isAdmin) {
      fetchBrokers()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const fetchBrokers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<User[] | { users: User[] }>('/users')
      setBrokers(Array.isArray(data) ? data : data.users ?? [])
    } catch {
      setError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBroker = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/users', { ...form, role: 'BROKER' })
      setShowModal(false)
      setForm(emptyBrokerForm)
      await fetchBrokers()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create broker'
      // Try to extract message from API response
      const apiErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } }
      setError(
        apiErr.response?.data?.error?.message ??
          apiErr.response?.data?.message ??
          msg
      )
    } finally {
      setSubmitting(false)
    }
  }

  const toggleBrokerStatus = async (broker: User) => {
    setTogglingId(broker.id)
    try {
      await api.patch(`/users/${broker.id}`, { isActive: !broker.isActive })
      setBrokers((prev) =>
        prev.map((b) =>
          b.id === broker.id ? { ...b, isActive: !b.isActive } : b
        )
      )
    } catch {
      setError('Failed to update broker status')
    } finally {
      setTogglingId(null)
    }
  }

  const update =
    (field: keyof BrokerForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  if (!isAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Team</h1>
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 shadow-sm">
          <div className="rounded-2xl bg-slate-100 p-4">
            <Shield className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-4 text-lg font-medium text-text">Access Restricted</p>
          <p className="mt-1 text-text-secondary">
            You don&apos;t have permission to manage team members.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Team</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your team members and roles.
          </p>
        </div>
        <button
          onClick={() => {
            setError('')
            setShowModal(true)
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          <UserPlus className="h-4 w-4" />
          Add Broker
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : brokers.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 shadow-sm">
          <div className="rounded-2xl bg-slate-100 p-4">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-4 text-lg font-medium text-text">No team members yet</p>
          <p className="mt-1 text-text-secondary">
            Add your first broker to get started.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brokers.map((broker) => (
            <div
              key={broker.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-sm">
                    {broker.firstName?.charAt(0) ?? ''}
                    {broker.lastName?.charAt(0) ?? ''}
                  </div>
                  <div>
                    <p className="font-medium text-text">
                      {broker.firstName} {broker.lastName}
                    </p>
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                        broker.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {broker.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleBrokerStatus(broker)}
                  disabled={togglingId === broker.id}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                  title={broker.isActive ? 'Deactivate' : 'Activate'}
                >
                  {togglingId === broker.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : broker.isActive ? (
                    <ToggleRight className="h-5 w-5 text-success" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{broker.email}</span>
                </div>
                {broker.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{broker.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="capitalize">
                    {broker.role?.replace('_', ' ').toLowerCase() ?? 'Broker'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Broker Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">Add Broker</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setError('')
                }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleAddBroker} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    First Name
                  </label>
                  <input
                    required
                    value={form.firstName}
                    onChange={update('firstName')}
                    placeholder="John"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-text placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Last Name
                  </label>
                  <input
                    required
                    value={form.lastName}
                    onChange={update('lastName')}
                    placeholder="Smith"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-text placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="broker@company.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-text placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-text placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-text placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setError('')
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Adding…' : 'Add Broker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
