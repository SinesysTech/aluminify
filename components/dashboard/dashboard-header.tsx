'use client'

import { Flame, Timer } from 'lucide-react'
import type { UserInfo } from '@/types/dashboard'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  user: UserInfo
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
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
        <h1 className="text-slate-900 dark:text-slate-50 text-3xl font-bold leading-tight">
          {getGreeting()}, {user.name}!
        </h1>
        <div className="flex items-center gap-2">
          <Flame className="text-orange-500 fill-orange-500" size={20} />
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
            {user.streakDays} {user.streakDays === 1 ? 'Dia seguido' : 'Dias seguidos'}
          </p>
        </div>
      </div>
      <Button
        variant="secondary"
        className="flex min-w-[84px] items-center justify-center gap-2 h-10 px-4"
      >
        <Timer className="text-base" size={16} />
        <span className="truncate">Modo Foco</span>
      </Button>
    </header>
  )
}









