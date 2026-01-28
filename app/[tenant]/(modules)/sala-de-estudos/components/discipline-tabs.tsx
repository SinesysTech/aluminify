'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/shared/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DisciplinaComFrentes } from '../types'

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
          <TabsList className="w-max min-w-full md:w-full h-auto p-1 bg-muted/50">
            {disciplinas.map((disciplina) => {
              const disciplinaStats = stats.get(disciplina.id)
              const completed = disciplinaStats?.completed || 0
              const total = disciplinaStats?.total || 0
              const isComplete = total > 0 && completed === total

              return (
                <TabsTrigger
                  key={disciplina.id}
                  value={disciplina.id}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 min-w-[120px]',
                    'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                    'transition-all duration-200'
                  )}
                >
                  <span className="truncate max-w-[150px]">{disciplina.nome}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0 h-5 tabular-nums shrink-0',
                      isComplete
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-muted text-muted-foreground'
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
