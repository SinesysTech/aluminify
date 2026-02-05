'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/shared/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DisciplinaComFrentes } from '../types'

const DISCIPLINE_COLORS = [
  { badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-500' },
  { badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
  { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  { badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20', dot: 'bg-teal-500' },
  { badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', dot: 'bg-violet-500' },
  { badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20', dot: 'bg-sky-500' },
]

interface DisciplineTabsProps {
  disciplinas: DisciplinaComFrentes[]
  activeDisciplinaId: string | null
  onDisciplinaChange: (id: string) => void
  stats: Map<string, { completed: number; total: number }>
  children?: React.ReactNode
  className?: string
}

export function DisciplineTabs({
  disciplinas,
  activeDisciplinaId,
  onDisciplinaChange,
  stats,
  children,
  className,
}: DisciplineTabsProps) {
  if (disciplinas.length === 0) {
    return null
  }

  // Se nenhuma disciplina selecionada, usar a primeira
  const effectiveActiveId = activeDisciplinaId || disciplinas[0]?.id || ''

  return (
    <Tabs
      value={effectiveActiveId}
      onValueChange={onDisciplinaChange}
      className={cn('w-full', className)}
    >
      <div className="relative">
        {/* Scroll container with fade edges on mobile */}
        <div className="overflow-x-auto scrollbar-hide pb-1 -mb-1">
          <TabsList className="w-max min-w-full md:w-full h-auto p-1 bg-muted/50 rounded-xl dark:bg-muted/30">
            {disciplinas.map((disciplina, index) => {
              const disciplinaStats = stats.get(disciplina.id)
              const completed = disciplinaStats?.completed || 0
              const total = disciplinaStats?.total || 0
              const isComplete = total > 0 && completed === total
              const color = DISCIPLINE_COLORS[index % DISCIPLINE_COLORS.length]

              return (
                <TabsTrigger
                  key={disciplina.id}
                  value={disciplina.id}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 min-w-[120px] rounded-lg',
                    'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                    'dark:data-[state=active]:bg-card/80',
                    'transition-all duration-200'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', color.dot)} />
                  <span className="truncate max-w-[150px]">{disciplina.nome}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0 h-5 tabular-nums shrink-0',
                      isComplete
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : color.badge
                    )}
                  >
                    {completed}/{total}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>
      </div>

      {/* Tab contents - render children for each disciplina */}
      {disciplinas.map((disciplina) => (
        <TabsContent
          key={disciplina.id}
          value={disciplina.id}
          className="mt-4 focus-visible:outline-none"
        >
          {effectiveActiveId === disciplina.id && children}
        </TabsContent>
      ))}
    </Tabs>
  )
}
