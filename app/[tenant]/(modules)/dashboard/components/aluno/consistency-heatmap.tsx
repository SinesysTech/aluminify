'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { CalendarDays, Info } from 'lucide-react'

export type HeatmapPeriod = 'mensal' | 'trimestral' | 'semestral' | 'anual'

interface ConsistencyHeatmapProps {
  data: HeatmapDay[]
  period: HeatmapPeriod
  onPeriodChange: (period: HeatmapPeriod) => void
}

const periodOptions: { value: HeatmapPeriod; label: string }[] = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
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
      case 'trimestral':
        return { days: 90, label: 'Últimos 3 meses' }
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
        return 'bg-muted hover:bg-muted/80'
      case 1:
        return 'bg-emerald-500/20 hover:bg-emerald-500/30'
      case 2:
        return 'bg-emerald-500/40 hover:bg-emerald-500/50'
      case 3:
        return 'bg-emerald-500/60 hover:bg-emerald-500/70'
      case 4:
        return 'bg-emerald-500/80 hover:bg-emerald-500/90'
      default:
        return 'bg-muted'
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
    <Card className="mb-6 md:mb-8">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Title + Info */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-base font-semibold">
              Consistência de Estudos
            </CardTitle>
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

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {periodOptions.map((p) => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-md transition-all font-medium',
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

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Dias ativos:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
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
              stats.percentage >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            )}>
              {stats.percentage}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-1 min-w-fit">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <TooltipProvider key={dayIndex} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-3 h-3 rounded-sm transition-colors cursor-default',
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
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/80" />
            </div>
            <span>Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
