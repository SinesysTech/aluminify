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
    if (score >= 75) {
      return 'bg-green-500'
    }
    if (score >= 60) {
      return 'bg-yellow-500'
    }
    return 'bg-red-500'
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-slate-900 dark:text-slate-50 text-lg font-semibold">
            Performance por Disciplina (Frente)
          </h2>
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
        <div className="grid grid-cols-1 gap-x-8 gap-y-6">
          {sortedSubjects.map((subject) => (
            <div key={subject.id} className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {subject.name} ({subject.front})
                </span>
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  {subject.score}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div
                  className={cn(
                    'h-2.5 rounded-full transition-all',
                    getBarColor(subject.score)
                  )}
                  style={{ width: `${subject.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}



