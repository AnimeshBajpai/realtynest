import { Link } from 'react-router-dom'
import { Building2, ShieldCheck } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-text">RealtyNest</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <ShieldCheck className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-text">Invitation Only</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Registration is by invitation only. Please contact your administrator for access.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-700 hover:to-indigo-600"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
