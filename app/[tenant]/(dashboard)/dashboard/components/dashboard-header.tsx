'use client'

import { useMemo, useState } from 'react'
import { Flame, Timer } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { UserInfo } from '@/app/[tenant]/(dashboard)/dashboard/types/student'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { OrganizationSwitcher } from '@/app/[tenant]/(dashboard)/dashboard/components/organization-switcher'

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
    return query ? `/foco?${query}` : '/foco'
  }, [searchParams, storedContext])

  // Determinar saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="page-title">
            {getGreeting()}, {user.name}!
          </h1>
          {/* Organization Switcher for multi-org students */}
          <OrganizationSwitcher variant="compact" />
        </div>
        <div className="flex items-center gap-2">
          <Flame className="text-[#FB923C] fill-[#FB923C]" size={20} />
          <p className="page-subtitle">
            {user.streakDays} {user.streakDays === 1 ? 'Dia seguido' : 'Dias seguidos'}
          </p>
        </div>
      </div>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="default"
              className="flex min-w-[120px] items-center justify-center gap-2 h-10 px-4 shadow-md hover:shadow-lg ring-1 ring-primary/20 hover:ring-primary/40"
            >
              <Link href={modoFocoHref} aria-label="Abrir Modo Foco">
                <Timer className="text-base" size={16} />
                <span className="truncate">Modo Foco</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="max-w-sm font-normal">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Estudo sem distrações, com sessão registrada</p>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>Cronômetro, timer regressivo e Pomodoro</li>
                <li>Monitora troca de aba (distrações) e registra pausas</li>
                <li>Salva a sessão de estudo para métricas (ex.: eficiência de foco)</li>
                <li>Mostra quantas pessoas estão estudando no mesmo contexto</li>
              </ul>
              <p className="text-xs text-slate-200">
                Dica: o botão tenta reutilizar o último contexto (curso/disciplina/módulo/atividade) quando disponível.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </header>
  )
}

