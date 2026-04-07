import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  BarChart3,
  Bell,
  Users,
  TrendingUp,
  Zap,
  UserPlus,
  ClipboardCheck,
  CheckCircle,
  Menu,
  X,
  Star,
  Play,
  ArrowRight,
  ChevronRight,
  Globe,
  MessageSquare,
  Share2,
  Mail,
} from 'lucide-react'
import { cn } from '../lib/utils'

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true)
      },
      { threshold: 0.3 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let frame: number
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [started, end, duration])

  return { count, ref }
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = useCallback((id: string) => {
    setOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const navLinks = [
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Testimonials', id: 'testimonials' },
  ]

  return (
    <nav
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border bg-white/80 shadow-sm backdrop-blur-xl'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
            <Building2 className="h-5 w-5" />
          </div>
          <span
            className={cn(
              'text-lg font-bold tracking-tight transition-colors',
              scrolled ? 'text-text' : 'text-white',
            )}
          >
            RealtyNest
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                scrolled
                  ? 'text-text-secondary hover:bg-primary-light hover:text-primary'
                  : 'text-white/80 hover:text-white',
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              scrolled
                ? 'text-text-secondary hover:text-primary'
                : 'text-white/80 hover:text-white',
            )}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-indigo-500/30"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'rounded-lg p-2 transition-colors md:hidden',
            scrolled ? 'text-text hover:bg-slate-100' : 'text-white hover:bg-white/10',
          )}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-b border-border bg-white/95 backdrop-blur-xl transition-all duration-300 md:hidden',
          open ? 'max-h-80' : 'max-h-0 border-transparent',
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {navLinks.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-text-secondary hover:bg-primary-light hover:text-primary"
            >
              {l.label}
            </button>
          ))}
          <hr className="my-2 border-border" />
          <Link
            to="/login"
            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-slate-50"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative min-h-[100vh] overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900">
      {/* Animated orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-400/30 blur-3xl"
          style={{
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl"
          style={{
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl"
          style={{
            animation: 'float 12s ease-in-out infinite 2s',
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 pt-32 pb-20 sm:px-6 lg:flex-row lg:gap-16 lg:px-8 lg:pt-40 lg:pb-28">
        {/* Left copy */}
        <div className="max-w-2xl text-center lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            Now in Open Beta — Try it free
          </div>

          <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Manage Your Real Estate Leads{' '}
            <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">
              Like Never Before
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-indigo-100/90 sm:text-xl">
            Streamline lead capture, automate follow-ups, and close deals faster. RealtyNest is the
            all-in-one platform trusted by top real estate agencies worldwide.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-slate-900 shadow-xl shadow-indigo-900/20 transition-all hover:bg-indigo-50 hover:shadow-2xl"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20">
              <Play className="h-4 w-4" />
              Watch Demo
            </button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-indigo-200/70 lg:justify-start">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-400" /> Free 14-day trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-400" /> No credit card
            </span>
          </div>
        </div>

        {/* Right — dashboard mockup */}
        <div className="relative w-full max-w-lg flex-shrink-0 lg:max-w-xl">
          <div
            className="relative rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-md"
            style={{ animation: 'floatSlow 6s ease-in-out infinite' }}
          >
            {/* Mini stat cards */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Total Leads', value: '2,847', color: 'from-indigo-500 to-indigo-600' },
                { label: 'Active', value: '1,204', color: 'from-emerald-500 to-emerald-600' },
                { label: 'Converted', value: '543', color: 'from-amber-500 to-amber-600' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm"
                >
                  <p className="text-[10px] font-medium tracking-wide text-indigo-200/70 uppercase">
                    {s.label}
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">{s.value}</p>
                  <div className={cn('mt-2 h-1 w-full rounded-full bg-gradient-to-r', s.color)} />
                </div>
              ))}
            </div>

            {/* Mini bar chart */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="mb-3 text-xs font-medium text-indigo-200/60">Weekly Performance</p>
              <div className="flex items-end gap-2">
                {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-indigo-500 to-purple-400 transition-all"
                      style={{
                        height: `${h}px`,
                        animation: `growUp 1s ease-out ${i * 0.1}s both`,
                      }}
                    />
                    <span className="text-[9px] text-indigo-300/50">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating mini notification */}
            <div
              className="absolute -right-4 -bottom-4 rounded-xl border border-white/10 bg-white/20 px-4 py-2.5 shadow-lg backdrop-blur-md"
              style={{ animation: 'floatSlow 5s ease-in-out infinite 1s' }}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">New Lead Converted!</p>
                  <p className="text-[10px] text-indigo-200/70">Just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom curve */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg viewBox="0 0 1440 80" fill="none" className="block w-full" preserveAspectRatio="none">
          <path d="M0 80V30C360 80 720 0 1080 30C1260 45 1380 60 1440 70V80H0Z" fill="#f8fafc" />
        </svg>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Stats Bar                                                          */
/* ------------------------------------------------------------------ */
function StatsBar() {
  const stats = [
    { label: 'Agencies', end: 500, suffix: '+' },
    { label: 'Leads Managed', end: 50000, suffix: '+' },
    { label: 'Satisfaction', end: 98, suffix: '%' },
    { label: 'Support', end: 24, suffix: '/7' },
  ]

  return (
    <section className="relative -mt-1 bg-background py-14">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((s) => {
          const { count, ref } = useCountUp(s.end)
          return (
            <div key={s.label} ref={ref} className="text-center">
              <p className="text-3xl font-extrabold text-text sm:text-4xl">
                {count.toLocaleString()}
                <span className="text-primary">{s.suffix}</span>
              </p>
              <p className="mt-1 text-sm font-medium text-text-muted">{s.label}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: BarChart3,
    title: 'Lead Pipeline Management',
    desc: 'Visualize your entire sales funnel with drag-and-drop Kanban boards. Track every lead from first contact to closed deal.',
  },
  {
    icon: Bell,
    title: 'Follow-Up Automation',
    desc: 'Never miss a follow-up again. Set automated reminders, email sequences, and smart scheduling based on lead activity.',
  },
  {
    icon: Users,
    title: 'Team Management',
    desc: 'Assign leads to agents, track individual performance, and collaborate in real time across your entire organization.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics Dashboard',
    desc: 'Get real-time insights with beautiful charts and reports. Understand conversion rates, response times, and ROI at a glance.',
  },
  {
    icon: Building2,
    title: 'Multi-Agency Support',
    desc: 'Manage multiple branches and agencies from one account. Set custom roles, permissions, and workflows per location.',
  },
  {
    icon: Zap,
    title: 'Real-Time Notifications',
    desc: 'Instant alerts for new leads, status changes, and team mentions. Stay on top of everything from anywhere.',
  },
]

function Features() {
  return (
    <section id="features" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary-light px-4 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
            Features
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Powerful tools designed specifically for real estate professionals to manage leads,
            automate workflows, and grow revenue.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-text">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */
const steps = [
  {
    num: 1,
    icon: UserPlus,
    title: 'Capture Leads',
    desc: 'Import leads from web forms, portals, social media, or enter them manually. Every lead lands in one unified inbox.',
  },
  {
    num: 2,
    icon: ClipboardCheck,
    title: 'Assign & Follow Up',
    desc: 'Automatically route leads to the right agent. Smart follow-up sequences ensure no opportunity is ever lost.',
  },
  {
    num: 3,
    icon: CheckCircle,
    title: 'Close Deals',
    desc: 'Track negotiations, schedule site visits, and move leads through your custom pipeline until the deal is done.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary-light px-4 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
            Three Simple Steps
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Get up and running in minutes, not months. Our streamlined process makes lead management
            effortless.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Dashed connector line (desktop only) */}
          <div className="absolute top-16 right-[16.67%] left-[16.67%] hidden h-0.5 border-t-2 border-dashed border-indigo-200 lg:block" />

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
            {steps.map((s) => (
              <div key={s.num} className="relative flex flex-col items-center text-center">
                {/* Number circle */}
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
                  {s.num}
                </div>
                <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-text">{s.title}</h3>
                <p className="mt-2 max-w-xs leading-relaxed text-text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard Preview                                                  */
/* ------------------------------------------------------------------ */
function DashboardPreview() {
  return (
    <section className="overflow-hidden bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary-light px-4 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
            Preview
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
            A Dashboard You'll Love
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Designed for clarity, speed, and delight. Every metric you need, right where you expect
            it.
          </p>
        </div>

        <div className="relative mt-16 flex justify-center" style={{ perspective: '1200px' }}>
          {/* Gradient border wrapper */}
          <div
            className="w-full max-w-4xl rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 p-[2px] shadow-2xl"
            style={{ transform: 'rotateY(-3deg) rotateX(2deg)' }}
          >
            <div className="flex h-[420px] overflow-hidden rounded-[calc(1rem-1px)] bg-slate-900 sm:h-[480px]">
              {/* Sidebar */}
              <div className="hidden w-48 flex-shrink-0 border-r border-slate-700/50 bg-slate-950 p-4 sm:block">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">RealtyNest</span>
                </div>
                {['Dashboard', 'Leads', 'Properties', 'Team', 'Analytics', 'Settings'].map(
                  (item, i) => (
                    <div
                      key={item}
                      className={cn(
                        'mb-1 rounded-lg px-3 py-2 text-xs font-medium',
                        i === 0
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'text-slate-400 hover:text-slate-200',
                      )}
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>

              {/* Main content */}
              <div className="flex-1 p-4 sm:p-6">
                {/* Header bar */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Good morning, Sarah 👋</p>
                    <p className="text-xs text-slate-400">Here's your lead overview</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-600/30" />
                    <div className="h-8 w-8 rounded-full bg-slate-700" />
                  </div>
                </div>

                {/* Stat cards */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Total Leads', val: '2,847', bg: 'bg-indigo-500/20', bar: 'bg-indigo-500' },
                    { label: 'Active', val: '1,204', bg: 'bg-emerald-500/20', bar: 'bg-emerald-500' },
                    { label: 'Converted', val: '543', bg: 'bg-amber-500/20', bar: 'bg-amber-500' },
                    { label: 'Revenue', val: '$1.2M', bg: 'bg-purple-500/20', bar: 'bg-purple-500' },
                  ].map((c) => (
                    <div key={c.label} className={cn('rounded-xl p-3', c.bg)}>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">{c.label}</p>
                      <p className="mt-1 text-lg font-bold text-white">{c.val}</p>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-700/50">
                        <div className={cn('h-full rounded-full', c.bar)} style={{ width: '65%' }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart area */}
                <div className="rounded-xl bg-slate-800/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-300">Lead Activity</p>
                    <div className="flex gap-1">
                      {['1W', '1M', '3M'].map((t, i) => (
                        <span
                          key={t}
                          className={cn(
                            'rounded px-2 py-0.5 text-[10px] font-medium',
                            i === 1 ? 'bg-indigo-600 text-white' : 'text-slate-500',
                          )}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end gap-1.5">
                    {[30, 50, 40, 70, 55, 85, 60, 90, 75, 65, 80, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-gradient-to-t from-indigo-600 to-purple-500 opacity-80"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Testimonials                                                       */
/* ------------------------------------------------------------------ */
const testimonials = [
  {
    quote:
      'RealtyNest transformed our lead management. We went from chaotic spreadsheets to a streamlined pipeline that actually works. Our conversion rate increased by 35% in just two months.',
    name: 'Sarah Mitchell',
    role: 'Broker, Apex Realty',
    initials: 'SM',
    accent: false,
  },
  {
    quote:
      'The automation features are incredible. Follow-ups happen on schedule, my team stays accountable, and I can finally focus on strategy instead of micromanaging. Best investment we made.',
    name: 'James Rodriguez',
    role: 'CEO, Horizon Properties',
    initials: 'JR',
    accent: true,
  },
  {
    quote:
      'We manage over 10,000 leads across three offices. RealtyNest handles it effortlessly. The multi-agency support and analytics dashboard give us visibility we never had before.',
    name: 'Priya Sharma',
    role: 'Director, NestWell Group',
    initials: 'PS',
    accent: false,
  },
]

function Testimonials() {
  return (
    <section id="testimonials" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary-light px-4 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
            Loved by Agencies Everywhere
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Don't take our word for it — here's what real estate professionals say about RealtyNest.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className={cn(
                'rounded-2xl border p-6 transition-shadow hover:shadow-lg',
                t.accent
                  ? 'border-indigo-100 bg-indigo-50'
                  : 'border-border bg-surface',
              )}
            >
              {/* Stars */}
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="leading-relaxed text-text-secondary">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white',
                    t.accent ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600',
                  )}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{t.name}</p>
                  <p className="text-xs text-text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  CTA Banner                                                         */
/* ------------------------------------------------------------------ */
function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Ready to Transform Your Real Estate Business?
        </h2>
        <p className="mt-6 text-lg text-slate-300">
          Join 500+ agencies already using RealtyNest to streamline their lead management. Start
          your free trial today — no credit card required.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:brightness-110"
          >
            Get Started Free
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-8 py-4 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white">
            <Mail className="h-4 w-4" />
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
const footerLinks = {
  Company: ['About', 'Careers', 'Contact'],
  Product: ['Features', 'Pricing', 'Integrations'],
  Resources: ['Blog', 'Help Center', 'API Docs'],
  Legal: ['Privacy', 'Terms', 'Security'],
}

function Footer() {
  return (
    <footer className="bg-slate-900 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white">RealtyNest</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              The modern lead management platform built for real estate professionals.
            </p>
            <div className="mt-6 flex gap-3">
              {[Globe, MessageSquare, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white">{title}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="my-10 border-slate-800" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-500">© 2026 RealtyNest. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((t) => (
              <a key={t} href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-300">
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/*  CSS Keyframes (injected once)                                      */
/* ------------------------------------------------------------------ */
const globalStyles = `
@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  33% { transform: translateY(-20px) translateX(10px); }
  66% { transform: translateY(10px) translateX(-10px); }
}
@keyframes floatSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes growUp {
  from { height: 0; opacity: 0; }
  to { opacity: 1; }
}
`

function InjectStyles() {
  useEffect(() => {
    const id = 'homepage-keyframes'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = globalStyles
    document.head.appendChild(style)
    return () => {
      document.getElementById(id)?.remove()
    }
  }, [])
  return null
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  return (
    <div className="min-h-screen font-sans antialiased">
      <InjectStyles />
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <DashboardPreview />
      <Testimonials />
      <CtaBanner />
      <Footer />
    </div>
  )
}
