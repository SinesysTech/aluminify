'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/app/shared/library/utils'
import type { HeatmapDay } from '../types'
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type HeatmapPeriod = 'mensal' | 'trimestral' | 'semestral' | 'anual'

interface ConsistencyHeatmapProps {
  data: HeatmapDay[]
  period: HeatmapPeriod
  onPeriodChange: (period: HeatmapPeriod) => void
}

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

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'bg-muted hover:bg-muted/80'
      case 1:
        return 'bg-primary/20 hover:bg-primary/30'
      case 2:
        return 'bg-primary/40 hover:bg-primary/50'
      case 3:
        return 'bg-primary/60 hover:bg-primary/70'
      case 4:
        return 'bg-primary/80 hover:bg-primary/90'
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
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">
          Consistência de Estudos
        </CardTitle>
        <div className="flex gap-2">
          {(['mensal', 'trimestral', 'semestral', 'anual'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={cn(
                'text-xs px-2 py-1 rounded transition-colors',
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-1 min-w-fit">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <TooltipProvider key={dayIndex} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-3 h-3 rounded-[2px] transition-colors',
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
              <div className="w-3 h-3 rounded-[2px] bg-muted" />
              <div className="w-3 h-3 rounded-[2px] bg-primary/20" />
              <div className="w-3 h-3 rounded-[2px] bg-primary/40" />
              <div className="w-3 h-3 rounded-[2px] bg-primary/60" />
              <div className="w-3 h-3 rounded-[2px] bg-primary/80" />
            </div>
            <span>Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
