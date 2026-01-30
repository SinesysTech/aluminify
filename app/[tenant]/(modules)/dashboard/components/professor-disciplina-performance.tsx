'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ProfessorDisciplinaPerformance } from '@/app/[tenant]/(modules)/dashboard/types'
import { cn } from '@/lib/utils'
import { BookOpen } from 'lucide-react'

interface ProfessorDisciplinaPerformanceListProps {
  disciplinas: ProfessorDisciplinaPerformance[]
}

function getPerformanceColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function getPerformanceTextColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  if (score >= 40) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

export function ProfessorDisciplinaPerformanceList({
  disciplinas,
}: ProfessorDisciplinaPerformanceListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Performance dos Alunos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {disciplinas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/70 mb-3" />
            <p className="text-sm text-muted-foreground">
              Sem dados de performance
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              A performance dos seus alunos aparecerá aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-3">
              {disciplinas.map((disciplina) => (
                <div key={disciplina.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {disciplina.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {disciplina.totalAlunos}{' '}
                        {disciplina.totalAlunos === 1 ? 'aluno' : 'alunos'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-bold ml-2',
                        getPerformanceTextColor(disciplina.aproveitamentoMedio)
                      )}
                    >
                      {disciplina.aproveitamentoMedio}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        getPerformanceColor(disciplina.aproveitamentoMedio)
                      )}
                      style={{ width: `${disciplina.aproveitamentoMedio}%` }}
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
