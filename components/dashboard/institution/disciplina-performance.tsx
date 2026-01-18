'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import type { DisciplinaPerformance } from '@/types/dashboard-institution'
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
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-semibold">
          Performance por Disciplina
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3">
        {disciplinas.length === 0 ? (
          <div className="flex items-center justify-center min-h-[80px]">
            <p className="text-xs text-muted-foreground">
              Nenhuma disciplina com dados
            </p>
          </div>
        ) : (
          <ScrollArea className="h-48 pr-2">
            <div className="space-y-2.5">
              {disciplinas.map((disciplina) => (
                <div key={disciplina.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{disciplina.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {disciplina.totalQuestoes} questoes - {disciplina.alunosAtivos} alunos
                      </p>
                    </div>
                    <span className={cn('text-xs font-bold ml-2', getPerformanceTextColor(disciplina.aproveitamento))}>
                      {disciplina.aproveitamento}%
                    </span>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
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
