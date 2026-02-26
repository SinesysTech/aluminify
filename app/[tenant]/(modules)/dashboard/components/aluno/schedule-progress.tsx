'use client'

import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, Flame, Sparkles, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduleProgressProps {
  value: number
  streakDays: number
}

export function ScheduleProgress({ value, streakDays }: ScheduleProgressProps) {
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
      'overflow-hidden border-0',
      isComplete
        ? 'bg-linear-to-r from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20'
        : 'bg-linear-to-r from-orange-600 via-red-500 to-rose-600 shadow-lg shadow-orange-500/20'
    )}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center gap-4 md:gap-5">
          {/* Streak Counter */}
          <div className="flex flex-col items-center shrink-0 min-w-14">
            <div className="relative mb-1">
              <Flame
                className={cn(
                  'h-7 w-7 md:h-8 md:w-8 transition-colors duration-200 motion-reduce:transition-none',
                  streakDays > 0
                    ? 'text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]'
                    : 'text-white/50'
                )}
                fill="currentColor"
              />
              {streakDays >= 7 && (
                <Sparkles className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-yellow-200" />
              )}
            </div>
            <span className="text-2xl md:text-3xl font-black text-white leading-none tabular-nums">
              {streakDays}
            </span>
            <span className="text-[10px] md:text-xs text-white/70 font-medium mt-0.5">
              {streakDays === 1 ? 'dia seguido' : 'dias seguidos'}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-white/20 shrink-0" />

          {/* Schedule Progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <Trophy className="h-4 w-4 text-white shrink-0" />
                ) : (
                  <CalendarDays className="h-4 w-4 text-white/80 shrink-0" />
                )}
                <span className="font-semibold text-sm md:text-base text-white truncate">
                  Progresso do Cronograma
                </span>
              </div>
              <span className="text-sm md:text-base font-bold text-white shrink-0 tabular-nums">
                {value}%
              </span>
            </div>

            {/* Custom Progress Bar */}
            <div className="h-2.5 md:h-3 bg-white/20 rounded-full overflow-hidden mb-2">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none',
                  isComplete ? 'bg-white' : 'bg-white/90'
                )}
                style={{ width: `${Math.max(value, 2)}%` }}
              />
            </div>

            <p className="text-xs text-white/70 truncate">
              {getMotivationalMessage()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
