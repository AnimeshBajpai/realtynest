import { useAuthStore } from '../store/authStore'
import { User, Mail, Phone, Shield, Building2 } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()

  const roleLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin'
      case 'AGENCY_ADMIN': return 'Agency Admin'
      case 'BROKER': return 'Broker'
      default: return role ?? '—'
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-text">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">View your account information and preferences.</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-text">Profile Information</h2>
        <p className="mt-1 text-sm text-text-secondary">Your account details from the system.</p>

        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-sm">
              {user?.firstName?.charAt(0) ?? ''}{user?.lastName?.charAt(0) ?? ''}
            </div>
            <div>
              <p className="text-lg font-semibold text-text">{user?.firstName} {user?.lastName}</p>
              <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                {roleLabel(user?.role)}
              </span>
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <div className="rounded-lg bg-blue-50 p-2">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary">Email</p>
                <p className="text-sm font-medium text-text">{user?.email ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <div className="rounded-lg bg-green-50 p-2">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary">Phone</p>
                <p className="text-sm font-medium text-text">{user?.phone ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <div className="rounded-lg bg-purple-50 p-2">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary">Role</p>
                <p className="text-sm font-medium text-text">{roleLabel(user?.role)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <div className="rounded-lg bg-amber-50 p-2">
                <User className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary">Status</p>
                <p className="text-sm font-medium text-text">{user?.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-text">Preferences</h2>
        <p className="mt-1 text-sm text-text-secondary">Application preferences and configurations.</p>
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="rounded-lg bg-indigo-50 p-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary">Organization</p>
            <p className="text-sm font-medium text-text">Managed by your agency administrator</p>
          </div>
        </div>
      </div>
    </div>
  )
}
