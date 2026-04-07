import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Building2, User, Lock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { ButtonLoader } from '../components/BrandLoader'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading, isAuthenticated, clearError } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    clearError()
  }, [clearError])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const isPhone = (val: string) => /^\+?\d[\d\s-]{8,}$/.test(val.trim())

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const trimmed = identifier.trim()
      const payload = isPhone(trimmed)
        ? { phone: trimmed.replace(/[\s-]/g, ''), password }
        : { email: trimmed, password }
      await login(payload)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-text">RealtyNest</span>
          </div>
          <p className="text-text-secondary">
            Sign in to manage your real estate business
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="identifier"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email or Phone
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@company.com or 9876543210"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm text-text placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm text-text placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-60"
            >
              {isLoading && <ButtonLoader />}
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-600 transition-colors hover:text-indigo-700"
            >
              Invitation only
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
