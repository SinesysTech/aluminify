'use client'

import type { StrategicDomain } from '@/types/dashboard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface StrategicDomainProps {
  data: StrategicDomain
}

function ScoreValue({ score }: { score: number | null }) {
  if (score == null) {
    return <span className="text-xs text-slate-500 dark:text-slate-400">Sem evidência</span>
  }
  return <span className="font-bold">{score}%</span>
}

function ProgressBar({
  value,
  barClassName,
}: {
  value: number | null
  barClassName: string
}) {
  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
      <div
        className={`${barClassName} h-3 rounded-full transition-all`}
        style={{ width: `${value ?? 0}%` }}
      />
    </div>
  )
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
                      Aqui, você vê separadamente:
                      <strong> Flashcards (memória)</strong> e <strong>Questões (aplicação)</strong>.
                    </p>
                    <p>
                      <strong>Módulos de Base</strong> representa conteúdos fundamentais que sustentam o restante.
                    </p>
                    <p>
                      <strong>Alta Recorrência</strong> representa tópicos que aparecem frequentemente nas provas.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex flex-col gap-4 md:gap-6">
            {/* Módulos de Base */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Módulos de Base</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Flashcards</span>
                  <span className="text-green-600 dark:text-green-500">
                    <ScoreValue score={data.baseModules.flashcardsScore} />
                  </span>
                </div>
                <ProgressBar value={data.baseModules.flashcardsScore} barClassName="bg-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Questões</span>
                  <span className="text-green-600 dark:text-green-500">
                    <ScoreValue score={data.baseModules.questionsScore} />
                  </span>
                </div>
                <ProgressBar value={data.baseModules.questionsScore} barClassName="bg-green-500/80" />
              </div>
            </div>

            {/* Alta Recorrência */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Alta Recorrência</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Flashcards</span>
                  <span className="text-yellow-600 dark:text-yellow-500">
                    <ScoreValue score={data.highRecurrence.flashcardsScore} />
                  </span>
                </div>
                <ProgressBar value={data.highRecurrence.flashcardsScore} barClassName="bg-yellow-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Questões</span>
                  <span className="text-yellow-600 dark:text-yellow-500">
                    <ScoreValue score={data.highRecurrence.questionsScore} />
                  </span>
                </div>
                <ProgressBar value={data.highRecurrence.questionsScore} barClassName="bg-yellow-500/80" />
              </div>
            </div>
          </div>

          {data.recommendations.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">
                Sugestões de foco
              </h3>
              <div className="space-y-2">
                {data.recommendations.map((rec) => (
                  <div
                    key={rec.moduloId}
                    className="flex items-start justify-between gap-3 rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                          {rec.moduloNome}
                        </p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {rec.importancia}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {rec.reason}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-slate-600 dark:text-slate-300">
                      {rec.flashcardsScore != null && <div>F: {rec.flashcardsScore}%</div>}
                      {rec.questionsScore != null && <div>Q: {rec.questionsScore}%</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

