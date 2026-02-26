'use client'

import { Circle, PlayCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/components/overlay/tooltip'
import { cn } from '@/lib/utils'
import { StatusAtividade } from '@/app/shared/types/enums'

interface StatusIndicatorProps {
  status: StatusAtividade | null
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function StatusIndicator({
  status,
  onClick,
  disabled = false,
  loading = false,
  size = 'md',
  className,
}: StatusIndicatorProps) {
  const effectiveStatus = status || 'Pendente'
  const isClickable = !!onClick && !disabled && !loading

  const getStatusConfig = () => {
    switch (effectiveStatus) {
      case 'Concluido':
        return {
          icon: CheckCircle2,
          bgClass: 'bg-emerald-500/10',
          iconClass: 'text-emerald-500',
          hoverClass: 'hover:bg-emerald-500/20',
          label: 'Concluído',
          tooltip: 'Clique para desmarcar',
        }
      case 'Iniciado':
        return {
          icon: PlayCircle,
          bgClass: 'bg-blue-500/10',
          iconClass: 'text-blue-500',
          hoverClass: 'hover:bg-blue-500/20',
          label: 'Em andamento',
          tooltip: 'Clique para marcar como concluído',
        }
      case 'Pendente':
      default:
        return {
          icon: Circle,
          bgClass: 'bg-muted',
          iconClass: 'text-muted-foreground',
          hoverClass: 'hover:bg-primary/10 hover:text-primary',
          label: 'Pendente',
          tooltip: 'Clique para marcar como concluído',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = loading ? Loader2 : config.icon

  const indicator = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || !onClick}
      className={cn(
        'rounded-full flex items-center justify-center transition-colors duration-200 motion-reduce:transition-none',
        sizeClasses[size],
        config.bgClass,
        isClickable && config.hoverClass,
        isClickable && 'cursor-pointer',
        !isClickable && 'cursor-default',
        disabled && 'opacity-50',
        className
      )}
      aria-label={config.label}
    >
      <Icon
        className={cn(
          iconSizeClasses[size],
          config.iconClass,
          loading && 'animate-spin'
        )}
      />
    </button>
  )

  if (!isClickable) {
    return indicator
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
