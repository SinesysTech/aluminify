import { LucideIcon } from "lucide-react"
import { cn } from "@/app/shared/library/utils"

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  isLoading?: boolean
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  isLoading = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        ) : (
          <span className="text-3xl font-bold tracking-tight">
            {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
          </span>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
          )}
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </div>
  )
}

interface StatCardSkeletonProps {
  className?: string
}

export function StatCardSkeleton({ className }: StatCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mt-3">
        <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="mt-2">
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
