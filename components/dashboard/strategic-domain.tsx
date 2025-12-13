'use client'

import type { StrategicDomain } from '@/types/dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface StrategicDomainProps {
  data: StrategicDomain
}

export function StrategicDomain({ data }: StrategicDomainProps) {
  return (
    <Card>
      <CardContent className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col justify-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <h2 className="text-slate-900 dark:text-slate-50 text-base md:text-lg font-semibold">
              Domínio Estratégico
            </h2>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Informações sobre domínio estratégico"
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
                  <div className="space-y-2 text-sm">
                    <p>
                      Este indicador mostra seu progresso em áreas estratégicas do conteúdo.
                    </p>
                    <p>
                      <strong>Módulos de Base</strong> representa o percentual de domínio nos conteúdos fundamentais
                      que são a base para todo o aprendizado.
                    </p>
                    <p>
                      <strong>Alta Recorrência</strong> mostra seu desempenho em tópicos que aparecem frequentemente
                      nas provas.
                    </p>
                    <p>
                      Focar nessas áreas estratégicas aumenta significativamente suas chances de sucesso.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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

