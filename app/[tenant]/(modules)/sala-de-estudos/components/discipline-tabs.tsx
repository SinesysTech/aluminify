'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/shared/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DisciplinaComFrentes } from '../types'

// Continuidade do gradiente: ProgressoStats(rose) → NextActivity(amber) → Disciplinas(yellow+)
const DISCIPLINE_COLORS = [
  { badge: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-500' },
  { badge: 'bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20', dot: 'bg-lime-500' },
  { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  { badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20', dot: 'bg-teal-500' },
  { badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
  { badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', dot: 'bg-violet-500' },
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
                    'flex items-center gap-2 px-4 py-2.5 min-w-30 rounded-lg',
                    'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                    'dark:data-[state=active]:bg-card/80',
                    'transition-colors duration-200 motion-reduce:transition-none'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', color.dot)} />
                  <span className="truncate max-w-37.5">{disciplina.nome}</span>
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
