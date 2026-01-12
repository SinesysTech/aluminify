'use client'

import { useState } from 'react'
import type { SubjectPerformance } from '@/types/dashboard'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubjectPerformanceListProps {
  subjects: SubjectPerformance[]
}

type SortOption = 'worst-best' | 'best-worst' | 'alphabetical'

export function SubjectPerformanceList({
  subjects,
}: SubjectPerformanceListProps) {
  const [sortOption, setSortOption] = useState<SortOption>('worst-best')

  // Função para ordenar os dados
  const sortedSubjects = [...subjects].sort((a, b) => {
    switch (sortOption) {
      case 'worst-best':
        return a.score - b.score
      case 'best-worst':
        return b.score - a.score
      case 'alphabetical':
        return `${a.name} (${a.front})`.localeCompare(`${b.name} (${b.front})`)
      default:
        return 0
    }
  })

  // Função para determinar a cor da barra baseada no score
  const getBarColor = (score: number) => {
    if (score >= 80) {
      return 'bg-green-500'
    }
    if (score >= 50) {
      return 'bg-yellow-500'
    }
    return 'bg-red-500'
  }

  return (
    <Card>
      <CardContent className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-base md:text-lg font-semibold">
              Performance por Disciplina (Frente)
            </h2>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Informações sobre as classificações de performance"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="start"
                  className="max-w-xs bg-slate-900 dark:bg-slate-800 text-slate-50 border-slate-700 p-3 z-50"
                  sideOffset={8}
                >
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Classificações:</p>
                    <ul className="space-y-1.5 text-xs">
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                        <span>≥ 80%: Excelente</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                        <span>≥ 50%: Regular</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                        <span>&lt; 50%: Precisa melhorar</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                        <span>Não iniciada: Sem atividades concluídas</span>
                      </li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="worst-best">Pior para Melhor</SelectItem>
              <SelectItem value="best-worst">Melhor para Pior</SelectItem>
              <SelectItem value="alphabetical">Ordem Alfabética</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:gap-y-6">
          {sortedSubjects.map((subject) => (
            <div key={subject.id} className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">
                  {subject.name} ({subject.front})
                </span>
                <span className="font-medium text-muted-foreground">
                  {subject.isNotStarted ? (
                    <span className="text-muted-foreground italic">
                      Não iniciada
                    </span>
                  ) : (
                    `${subject.score}%`
                  )}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                {subject.isNotStarted ? (
                  <div className="h-2.5 rounded-full bg-muted-foreground/25" />
                ) : (
                  <div
                    className={cn(
                      'h-2.5 rounded-full transition-all',
                      getBarColor(subject.score)
                    )}
                    style={{ width: `${subject.score}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}



