import { Users, UserCheck, TrendingUp, BarChart3 } from 'lucide-react'
import { cn } from '../lib/utils'

interface StatCard {
  label: string
  value: string
  change: string
  positive: boolean
  icon: React.ElementType
  color: string
}

const stats: StatCard[] = [
  {
    label: 'Total Leads',
    value: '1,284',
    change: '+12%',
    positive: true,
    icon: Users,
    color: 'bg-blue-50 text-primary',
  },
  {
    label: 'Active Leads',
    value: '342',
    change: '+8%',
    positive: true,
    icon: TrendingUp,
    color: 'bg-amber-50 text-warning',
  },
  {
    label: 'Converted',
    value: '89',
    change: '+24%',
    positive: true,
    icon: UserCheck,
    color: 'bg-green-50 text-success',
  },
  {
    label: 'Conversion Rate',
    value: '6.9%',
    change: '-2%',
    positive: false,
    icon: BarChart3,
    color: 'bg-red-50 text-danger',
  },
]

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Welcome back!</h1>
        <p className="text-text-secondary">
          Here&apos;s what&apos;s happening with your leads today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">
                {stat.label}
              </span>
              <div className={cn('rounded-lg p-2', stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-text">{stat.value}</p>
            <p
              className={cn(
                'mt-1 text-sm font-medium',
                stat.positive ? 'text-success' : 'text-danger'
              )}
            >
              {stat.change} from last month
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
