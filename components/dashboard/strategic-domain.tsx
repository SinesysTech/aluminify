'use client'

import type { StrategicDomain } from '@/types/dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface StrategicDomainProps {
  data: StrategicDomain
}

export function StrategicDomain({ data }: StrategicDomainProps) {
  return (
    <Card>
      <CardContent className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col justify-center gap-4 md:gap-6">
          <h2 className="text-slate-900 dark:text-slate-50 text-base md:text-lg font-semibold">
            Domínio Estratégico
          </h2>
          <div className="flex flex-col gap-4 md:gap-6">
            {/* Módulos de Base */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Módulos de Base
                </span>
                <span className="font-bold text-green-600 dark:text-green-500">
                  {data.baseModules}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${data.baseModules}%` }}
                />
              </div>
            </div>

            {/* Alta Recorrência */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Alta Recorrência
                </span>
                <span className="font-bold text-yellow-500">
                  {data.highRecurrence}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all"
                  style={{ width: `${data.highRecurrence}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

