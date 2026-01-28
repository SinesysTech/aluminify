'use client'

import { Progress } from "@/app/shared/components/feedback/progress"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, TrendingUp, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduleProgressProps {
  value: number
}

export function ScheduleProgress({ value }: ScheduleProgressProps) {
  // Mensagem motivacional baseada no progresso
  const getMotivationalMessage = () => {
    if (value === 0) return 'Comece sua jornada!'
    if (value < 25) return 'Você está começando bem!'
    if (value < 50) return 'Continue assim!'
    if (value < 75) return 'Mais da metade concluída!'
    if (value < 100) return 'Quase lá, não desista!'
    return 'Parabéns! Cronograma completo!'
  }

  const isComplete = value >= 100

  return (
    <Card className={cn(
      'mb-6 overflow-hidden transition-all duration-300',
      isComplete
        ? 'bg-linear-to-r from-emerald-500/10 via-green-500/5 to-transparent border-emerald-500/30'
        : 'bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-primary/20'
    )}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn(
            'flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl shrink-0 transition-transform hover:scale-105',
            isComplete
              ? 'bg-emerald-500/15'
              : 'bg-primary/10'
          )}>
            {isComplete ? (
              <Trophy className="h-6 w-6 md:h-7 md:w-7 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <CalendarDays className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm md:text-base truncate">
                  Progresso do Cronograma
                </span>
                {value > 0 && !isComplete && (
                  <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0 hidden sm:block" />
                )}
              </div>
              <span className={cn(
                'text-sm md:text-base font-bold shrink-0',
                isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
              )}>
                {value}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <Progress
                value={value}
                className={cn(
                  'h-2.5 md:h-3',
                  isComplete && '[&>div]:bg-emerald-500'
                )}
              />
            </div>

            {/* Motivational Message */}
            <p className="text-xs text-muted-foreground mt-1.5 hidden sm:block">
              {getMotivationalMessage()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
