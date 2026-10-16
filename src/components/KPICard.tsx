import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface KPICardProps {
  title: string
  value: string | number
  delta?: string
  trend?: 'up' | 'down'
  icon: LucideIcon
  tone: 'primary' | 'success' | 'warning' | 'error'
  subtext?: string
}

const toneMap = {
  primary: {
    bg: 'bg-lavender-soft',
    text: 'text-lavender',
  },
  success: {
    bg: 'bg-mint-soft',
    text: 'text-mint',
  },
  warning: {
    bg: 'bg-ochre-soft',
    text: 'text-ochre',
  },
  error: {
    bg: 'bg-bordeaux-soft',
    text: 'text-bordeaux',
  },
}

export function KPICard({ title, value, delta, trend, icon: Icon, tone, subtext }: KPICardProps) {
  const styles = toneMap[tone]

  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 border-gray-100 bg-white">
      {/* Decorative circle */}
      <div
        className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-50 transition-transform duration-500 group-hover:scale-110 ${styles.bg}`}
      />

      <div className="p-5 flex flex-col gap-4 relative z-10">
        <div className="flex justify-between items-start">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className={`p-2 rounded-lg ${styles.bg} ${styles.text}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h3 className="font-mono text-2xl font-semibold tracking-tight text-gray-900 mb-1">
            {value}
          </h3>
          {(delta || subtext) && (
            <div className="flex items-center gap-2 text-xs">
              {delta && (
                <span
                  className={`flex items-center font-medium ${trend === 'down' ? 'text-bordeaux' : 'text-mint'}`}
                >
                  {trend === 'down' ? (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  )}
                  {delta}
                </span>
              )}
              {subtext && <span className="text-gray-400">{subtext}</span>}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
