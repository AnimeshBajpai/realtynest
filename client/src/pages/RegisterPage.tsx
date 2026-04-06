import { Link } from 'react-router-dom'
import { Building2, ShieldCheck } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Building2 className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold text-text">RealtyNest</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-surface p-8 shadow-sm text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="text-lg font-semibold text-text">Invitation Only</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Registration is by invitation only. Please contact your administrator for access.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
