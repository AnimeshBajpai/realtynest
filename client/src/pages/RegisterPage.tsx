import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({
    agencyName: '',
    adminName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO: integrate with auth API
    console.log('Register:', form)
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-text placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Building2 className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold text-text">RealtyNest</span>
          </div>
          <p className="text-text-secondary">Create your agency account</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-surface p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="agencyName" className="mb-1.5 block text-sm font-medium text-text">
                Agency Name
              </label>
              <input
                id="agencyName"
                required
                value={form.agencyName}
                onChange={update('agencyName')}
                placeholder="Acme Realty"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="adminName" className="mb-1.5 block text-sm font-medium text-text">
                Admin Name
              </label>
              <input
                id="adminName"
                required
                value={form.adminName}
                onChange={update('adminName')}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-text">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={form.phone}
                onChange={update('phone')}
                placeholder="+1 (555) 000-0000"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-text">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Create Agency
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary-dark"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
