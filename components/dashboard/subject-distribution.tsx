'use client'

import type { SubjectDistributionItem } from '@/types/dashboard'
import { Card, CardContent } from '@/components/ui/card'

interface SubjectDistributionProps {
  data: SubjectDistributionItem[]
  totalHours?: number // Total de horas para exibir no centro
}

export function SubjectDistribution({
  data,
  totalHours = 42,
}: SubjectDistributionProps) {
  // Calcular os offsets para o stroke-dasharray
  let currentOffset = 0
  const radius = 15.91549430918954
  const circumference = 2 * Math.PI * radius

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-slate-900 dark:text-slate-50 text-lg font-semibold mb-6">
          Distribuição por Disciplina
        </h2>
        <div className="flex flex-1 items-center justify-center py-4">
          <div className="relative flex items-center justify-center w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              {/* Círculo de fundo */}
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                stroke="#e6e6e6"
                strokeWidth="4"
                className="dark:stroke-slate-700"
              />
              {/* Segmentos do gráfico */}
              {data.map((item, index) => {
                const dashArray = `${(item.percentage / 100) * circumference} ${circumference}`
                const offset = -currentOffset
                currentOffset += (item.percentage / 100) * circumference

                return (
                  <circle
                    key={index}
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeDasharray={dashArray}
                    strokeDashoffset={offset}
                    strokeWidth="4"
                    transform="rotate(-90 18 18)"
                  />
                )
              })}
            </svg>
            {/* Texto central */}
            <div className="absolute flex flex-col items-center">
              <span className="text-slate-500 dark:text-slate-400 text-sm">
                Total
              </span>
              <span className="text-slate-900 dark:text-slate-50 text-xl font-bold">
                {totalHours}h
              </span>
            </div>
          </div>
        </div>
        {/* Legenda */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {item.name} - {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}





