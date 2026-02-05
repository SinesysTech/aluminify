'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/shared/components/overlay/tooltip'
import { cn } from '@/lib/utils'
import type { HeatmapDay } from '../../types'
import { format, subDays, startOfWeek, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Info, Flame } from 'lucide-react'

export type HeatmapPeriod = 'mensal' | 'semestral' | 'anual'

interface ConsistencyHeatmapProps {
  data: HeatmapDay[]
  period: HeatmapPeriod
  onPeriodChange: (period: HeatmapPeriod) => void
}

const periodOptions: { value: HeatmapPeriod; label: string }[] = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
]

export function ConsistencyHeatmap({
  data,
  period,
  onPeriodChange,
}: ConsistencyHeatmapProps) {
  // Configuração dos períodos
  const periodConfig = useMemo(() => {
    switch (period) {
      case 'mensal':
        return { days: 30, label: 'Últimos 30 dias' }
      case 'semestral':
        return { days: 180, label: 'Últimos 6 meses' }
      case 'anual':
        return { days: 365, label: 'Último ano' }
    }
  }, [period])

  // Gerar array de dias para o heatmap
  const days = useMemo(() => {
    const today = new Date()
    const startDate = subDays(today, periodConfig.days - 1)

    // Ajustar para começar no domingo da semana correta
    const calendarStart = startOfWeek(startDate, { weekStartsOn: 0 })

    const dayList: { date: Date; intensity: number }[] = []

    // Calcular quantos dias gerar para preencher até hoje (e completar a semana)
    let current = calendarStart
    // Continuar até chegar em hoje OU terminar a semana atual
    const endCalendar = addDays(startOfWeek(today, { weekStartsOn: 0 }), 6)

    while (current <= endCalendar) {
      const dateStr = format(current, 'yyyy-MM-dd')
      const dayData = data.find((d) => d.date === dateStr)

      dayList.push({
        date: current,
        intensity: dayData?.intensity || 0,
      })

      current = addDays(current, 1)
    }

    return dayList
  }, [data, periodConfig.days])

  // Agrupar dias em semanas
  const weeks = useMemo(() => {
    const weekList: { date: Date; intensity: number }[][] = []
    let currentWeek: { date: Date; intensity: number }[] = []

    days.forEach((day, index) => {
      currentWeek.push(day)
      if (currentWeek.length === 7 || index === days.length - 1) {
        weekList.push(currentWeek)
        currentWeek = []
      }
    })

    return weekList
  }, [days])

  // Calcular estatísticas
  const stats = useMemo(() => {
    const activeDays = data.filter(d => d.intensity > 0).length
    const totalDays = periodConfig.days
    const percentage = Math.round((activeDays / totalDays) * 100)
    return { activeDays, totalDays, percentage }
  }, [data, periodConfig.days])

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'bg-muted/40 hover:bg-muted/60'
      case 1:
        return 'bg-rose-500/40 hover:bg-rose-500/50 dark:bg-rose-400/40 dark:hover:bg-rose-400/50'
      case 2:
        return 'bg-rose-500/60 hover:bg-rose-500/70 dark:bg-rose-400/60 dark:hover:bg-rose-400/70'
      case 3:
        return 'bg-rose-500/80 hover:bg-rose-500/90 dark:bg-rose-400/80 dark:hover:bg-rose-400/90'
      case 4:
        return 'bg-rose-500 hover:bg-rose-500/90 dark:bg-rose-400 dark:hover:bg-rose-400/90'
      default:
        return 'bg-muted/40'
    }
  }

  const getIntensityLabel = (intensity: number) => {
    switch (intensity) {
      case 0: return 'Sem atividade'
      case 1: return 'Pouca atividade'
      case 2: return 'Atividade moderada'
      case 3: return 'Boa atividade'
      case 4: return 'Muita atividade'
      default: return 'Sem dados'
    }
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 rounded-2xl pt-0 dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5">
      <div className="h-0.5 bg-linear-to-r from-rose-400 to-red-500" />
      <CardContent className="p-4 md:p-5">
        {/* Header with icon badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-rose-500 to-red-500">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="widget-title">Consistência de Estudos</h3>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Visualize sua consistência de estudos ao longo do tempo.
                      Quanto mais escuro, mais atividade no dia!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">{periodConfig.label}</p>
          </div>
        </div>

        {/* Controls and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Dias ativos:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {stats.activeDays}
              </span>
              <span className="text-muted-foreground">
                de {stats.totalDays}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-muted-foreground">Consistência:</span>
              <span className={cn(
                'font-semibold',
                stats.percentage >= 50 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
              )}>
                {stats.percentage}%
              </span>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {periodOptions.map((p) => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                className={cn(
                  'text-xs px-3 py-2 md:py-1.5 rounded-md transition-all font-medium touch-manipulation min-h-9',
                  period === p.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap- min-w-fit">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.75">
                  {week.map((day, dayIndex) => (
                    <TooltipProvider key={dayIndex} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'size-3.5 rounded-sm transition-colors cursor-default',
                              getIntensityColor(day.intensity)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent
                          className="text-xs"
                          side="top"
                        >
                          <div className="text-center">
                            <p className="font-semibold">
                              {format(day.date, "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                            <p className="text-muted-foreground">
                              {getIntensityLabel(day.intensity)}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-2">
            <span>Menos</span>
            <div className="flex gap-1">
              <div className="size-3.5 rounded-sm bg-muted/40" />
              <div className="size-3.5 rounded-sm bg-rose-500/40 dark:bg-rose-400/40" />
              <div className="size-3.5 rounded-sm bg-rose-500/60 dark:bg-rose-400/60" />
              <div className="size-3.5 rounded-sm bg-rose-500/80 dark:bg-rose-400/80" />
              <div className="size-3.5 rounded-sm bg-rose-500 dark:bg-rose-400" />
            </div>
            <span>Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
