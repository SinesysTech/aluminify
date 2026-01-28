'use client'

import { useMemo, useState } from 'react'
import { Flame, Timer, TrendingUp, Sparkles } from 'lucide-react'
import { useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import type { UserInfo } from '../../types'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/components/overlay/tooltip'
import { OrganizationSwitcher } from '@/app/[tenant]/(modules)/dashboard/components/organization-switcher'
import { cn } from '@/lib/utils'

type FocusContext = {
  cursoId?: string
  disciplinaId?: string
  frenteId?: string
  moduloId?: string
  atividadeId?: string
}

const FOCUS_CONTEXT_STORAGE_KEY = 'modo-foco:context'

interface DashboardHeaderProps {
  user: UserInfo
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const params = useParams()
  const tenant = params?.tenant as string
  const searchParams = useSearchParams()
  const [storedContext] = useState<FocusContext | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(FOCUS_CONTEXT_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (!parsed || typeof parsed !== 'object') return null

      return {
        cursoId: typeof parsed.cursoId === 'string' ? parsed.cursoId : undefined,
        disciplinaId: typeof parsed.disciplinaId === 'string' ? parsed.disciplinaId : undefined,
        frenteId: typeof parsed.frenteId === 'string' ? parsed.frenteId : undefined,
        moduloId: typeof parsed.moduloId === 'string' ? parsed.moduloId : undefined,
        atividadeId: typeof parsed.atividadeId === 'string' ? parsed.atividadeId : undefined,
      }
    } catch {
      return null
    }
  })

  const modoFocoHref = useMemo(() => {
    const qs = new URLSearchParams()
    const keys: Array<keyof FocusContext> = [
      'cursoId',
      'disciplinaId',
      'frenteId',
      'moduloId',
      'atividadeId',
    ]

    for (const key of keys) {
      const fromUrl = searchParams.get(key) ?? undefined
      const fromStorage = storedContext?.[key]
      const value = (fromUrl || fromStorage || '').trim()
      if (value) qs.set(key, value)
    }

    const query = qs.toString()
    const basePath = tenant ? `/${tenant}/foco` : '/foco'
    return query ? `${basePath}?${query}` : basePath
  }, [searchParams, storedContext, tenant])

  // Determinar saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Mensagem motivacional baseada no streak
  const getMotivationalMessage = () => {
    if (user.streakDays === 0) return 'Comece sua jornada hoje!'
    if (user.streakDays < 3) return 'Continue assim!'
    if (user.streakDays < 7) return 'Você está no caminho certo!'
    if (user.streakDays < 14) return 'Impressionante consistência!'
    if (user.streakDays < 30) return 'Você é imparável!'
    return 'Lendário!'
  }

  // Cor do streak baseada no número de dias
  const getStreakIntensity = () => {
    if (user.streakDays === 0) return 'text-muted-foreground'
    if (user.streakDays < 3) return 'text-orange-400'
    if (user.streakDays < 7) return 'text-orange-500'
    if (user.streakDays < 14) return 'text-amber-500'
    return 'text-amber-400'
  }

  return (
    <header className="mb-6 md:mb-8">
      {/* Mobile Layout */}
      <div className="flex flex-col gap-4 md:hidden">
        {/* Greeting + Organization */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {getGreeting()}, {user.name.split(' ')[0]}!
            </h1>
            <OrganizationSwitcher variant="compact" />
          </div>
        </div>

        {/* Streak Badge + Focus Button Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Streak Badge */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full',
                  'bg-linear-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10',
                  'border border-orange-500/20',
                  'cursor-default'
                )}>
                  <div className="relative">
                    <Flame
                      className={cn('h-5 w-5 transition-colors', getStreakIntensity())}
                      fill="currentColor"
                    />
                    {user.streakDays >= 7 && (
                      <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn('text-sm font-bold leading-tight', getStreakIntensity())}>
                      {user.streakDays} {user.streakDays === 1 ? 'dia' : 'dias'}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {getMotivationalMessage()}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">Streak de Estudos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estude todos os dias para manter sua sequência ativa!
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Focus Mode Button */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="default"
                  className={cn(
                    'gap-2 font-semibold shadow-lg',
                    'bg-linear-to-r from-primary to-primary/80',
                    'hover:from-primary/90 hover:to-primary/70',
                    'transition-all duration-200'
                  )}
                >
                  <Link href={modoFocoHref} aria-label="Abrir Modo Foco">
                    <Timer className="h-4 w-4" />
                    <span>Modo Foco</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-sm font-normal">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Estudo sem distrações</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs">
                    <li>Cronômetro, timer e Pomodoro</li>
                    <li>Monitora distrações e pausas</li>
                    <li>Salva sessão para métricas</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
        {/* Left Side: Greeting + Streak */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {getGreeting()}, {user.name}!
              </h1>
              <OrganizationSwitcher variant="compact" />
            </div>
          </div>

          {/* Streak Badge */}
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
                      className={cn('h-6 w-6 transition-colors', getStreakIntensity())}
                      fill="currentColor"
                    />
                    {user.streakDays >= 7 && (
                      <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn('text-base font-bold leading-tight', getStreakIntensity())}>
                      {user.streakDays} {user.streakDays === 1 ? 'dia' : 'dias'} seguidos
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {getMotivationalMessage()}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">Streak de Estudos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estude todos os dias para manter sua sequência ativa e desbloquear conquistas!
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right Side: Focus Button */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                size="lg"
                className={cn(
                  'gap-2 font-semibold shadow-lg px-6',
                  'bg-linear-to-r from-primary to-primary/80',
                  'hover:from-primary/90 hover:to-primary/70',
                  'hover:shadow-xl hover:scale-[1.02]',
                  'transition-all duration-200'
                )}
              >
                <Link href={modoFocoHref} aria-label="Abrir Modo Foco">
                  <Timer className="h-5 w-5" />
                  <span>Modo Foco</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="max-w-sm font-normal">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Estudo sem distrações, com sessão registrada</p>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li>Cronômetro, timer regressivo e Pomodoro</li>
                  <li>Monitora troca de aba (distrações) e registra pausas</li>
                  <li>Salva a sessão de estudo para métricas</li>
                  <li>Mostra quantas pessoas estão estudando</li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  Dica: reutiliza o último contexto quando disponível.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
