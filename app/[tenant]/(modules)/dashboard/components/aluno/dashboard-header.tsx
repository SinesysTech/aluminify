'use client'

import { useMemo, useState } from 'react'
import { Timer } from 'lucide-react'
import { useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import type { UserInfo } from '../../types'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/components/overlay/tooltip'
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

  return (
    <header className="rounded-2xl border border-border/40 bg-card/50 p-4 md:p-5 dark:bg-card/40 dark:backdrop-blur-sm dark:border-white/5">
      {/* Mobile Layout */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <h1 className="page-title truncate">
          {getGreeting()}, {user.name.split(' ')[0]}!
        </h1>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                size="default"
                className={cn(
                  'gap-2 font-semibold shrink-0 cursor-pointer',
                  'bg-foreground text-background',
                  'hover:bg-foreground/90',
                  'transition-colors duration-200 motion-reduce:transition-none'
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

      {/* Desktop Layout */}
      <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
        <h1 className="page-title">
          {getGreeting()}, {user.name}!
        </h1>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                size="lg"
                className={cn(
                  'gap-2 font-semibold px-6 cursor-pointer',
                  'bg-foreground text-background',
                  'hover:bg-foreground/90',
                  'transition-colors duration-200 motion-reduce:transition-none'
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
