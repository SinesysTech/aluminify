'use client'

import { useMemo } from 'react'
import { Flame, Sparkles, TrendingUp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/components/overlay/tooltip'
import { OrganizationSwitcher } from '@/app/[tenant]/(modules)/dashboard/components/organization-switcher'
import { cn } from '@/lib/utils'

interface StudyRoomHeaderProps {
  userName: string
  streakDays: number
}

export function StudyRoomHeader({ userName, streakDays }: StudyRoomHeaderProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const motivationalMessage = useMemo(() => {
    if (streakDays === 0) return 'Comece sua jornada hoje!'
    if (streakDays < 3) return 'Continue assim!'
    if (streakDays < 7) return 'Voce esta no caminho certo!'
    if (streakDays < 14) return 'Impressionante consistencia!'
    if (streakDays < 30) return 'Voce e imparavel!'
    return 'Lendario!'
  }, [streakDays])

  const streakIntensity = useMemo(() => {
    if (streakDays === 0) return 'text-muted-foreground'
    if (streakDays < 3) return 'text-orange-400'
    if (streakDays < 7) return 'text-orange-500'
    if (streakDays < 14) return 'text-amber-500'
    return 'text-amber-400'
  }, [streakDays])

  const firstName = userName.split(' ')[0]

  return (
    <header className="mb-6">
      {/* Mobile Layout */}
      <div className="flex flex-col gap-4 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {greeting}, {firstName}!
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sua sala de estudos
            </p>
          </div>
          <OrganizationSwitcher variant="compact" />
        </div>

        {/* Streak Badge Mobile */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-full w-fit',
                'bg-linear-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10',
                'border border-orange-500/20',
                'cursor-default'
              )}>
                <div className="relative">
                  <Flame
                    className={cn('h-5 w-5 transition-colors', streakIntensity)}
                    fill="currentColor"
                  />
                  {streakDays >= 7 && (
                    <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={cn('text-sm font-bold leading-tight', streakIntensity)}>
                    {streakDays} {streakDays === 1 ? 'dia' : 'dias'}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {motivationalMessage}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">Streak de Estudos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Estude todos os dias para manter sua sequencia ativa!
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {greeting}, {userName}!
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Sua sala de estudos - acompanhe seu progresso
            </p>
          </div>

          {/* Streak Badge Desktop */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-2xl',
                  'bg-linear-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10',
                  'border border-orange-500/20',
                  'hover:border-orange-500/40 transition-colors cursor-default'
                )}>
                  <div className="relative">
                    <Flame
                      className={cn('h-6 w-6 transition-colors', streakIntensity)}
                      fill="currentColor"
                    />
                    {streakDays >= 7 && (
                      <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn('text-base font-bold leading-tight', streakIntensity)}>
                      {streakDays} {streakDays === 1 ? 'dia' : 'dias'} seguidos
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {motivationalMessage}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">Streak de Estudos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estude todos os dias para manter sua sequencia ativa e desbloquear conquistas!
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <OrganizationSwitcher />
      </div>
    </header>
  )
}
