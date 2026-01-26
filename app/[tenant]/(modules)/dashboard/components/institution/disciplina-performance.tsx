'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { DisciplinaPerformance } from '@/app/[tenant]/(modules)/dashboard/types'
import { cn } from '@/lib/utils'

interface DisciplinaPerformanceListProps {
  disciplinas: DisciplinaPerformance[]
}

function getPerformanceColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function getPerformanceTextColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

export function DisciplinaPerformanceList({ disciplinas }: DisciplinaPerformanceListProps) {
  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">
          Performance por Disciplina
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {disciplinas.length === 0 ? (
          <div className="flex items-center justify-center min-h-[100px]">
            <p className="text-sm text-muted-foreground">
              Nenhuma disciplina com dados de performance
            </p>
          </div>
        ) : (
          <ScrollArea className="h-52 pr-3">
            <div className="space-y-3">
              {disciplinas.map((disciplina) => (
                <div key={disciplina.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{disciplina.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {disciplina.totalQuestoes} questões · {disciplina.alunosAtivos} alunos
                      </p>
                    </div>
                    <span className={cn('text-sm font-bold ml-3', getPerformanceTextColor(disciplina.aproveitamento))}>
                      {disciplina.aproveitamento}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full transition-all', getPerformanceColor(disciplina.aproveitamento))}
                      style={{ width: `${disciplina.aproveitamento}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
