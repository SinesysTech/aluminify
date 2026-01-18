'use client'

import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  subtext?: string
  icon?: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'info'
  className?: string
}

const variantStyles = {
  default: {
    icon: 'text-muted-foreground',
    trend: {
      positive: 'text-[#34D399]',
      negative: 'text-[#F87171]',
    },
  },
  success: {
    icon: 'text-emerald-500',
    trend: {
      positive: 'text-[#34D399]',
      negative: 'text-[#F87171]',
    },
  },
  warning: {
    icon: 'text-amber-500',
    trend: {
      positive: 'text-[#34D399]',
      negative: 'text-[#F87171]',
    },
  },
  info: {
    icon: 'text-blue-500',
    trend: {
      positive: 'text-[#34D399]',
      negative: 'text-[#F87171]',
    },
  },
}

export function StatsCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="px-4 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && (
                <Icon className={cn('h-5 w-5', styles.icon)} />
              )}
              <p className="text-sm font-medium text-muted-foreground">
                {label}
              </p>
            </div>
          </div>

          <p className="text-2xl font-bold tracking-tight">{value}</p>

          {trend ? (
            <p
              className={cn(
                'text-xs font-medium',
                trend.isPositive
                  ? styles.trend.positive
                  : styles.trend.negative
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}
            </p>
          ) : subtext ? (
            <p className="text-xs text-muted-foreground">{subtext}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
