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
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
              aria-label="O que significa sem evidência?"
            >
              Sem evidência
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="max-w-xs">
            Ainda não há dados suficientes para calcular este indicador (por exemplo: poucas questões/flashcards feitos neste tópico).
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
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
    <div className="w-full bg-muted rounded-full h-3">
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
            <h2 className="text-foreground text-base md:text-lg font-semibold">
              Domínio Estratégico
            </h2>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
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
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="font-medium text-foreground underline decoration-dotted underline-offset-2"
                        aria-label="O que são módulos de base?"
                      >
                        Módulos de Base
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start" className="max-w-xs">
                      Conteúdos fundamentais que servem de base para entender o restante da matéria. Melhorar aqui tende a destravar evolução em vários tópicos.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Flashcards</span>
                  <span className="text-green-600 dark:text-green-500">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <ScoreValue score={data.baseModules.flashcardsScore} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center" className="max-w-xs">
                          Percentual de desempenho em flashcards neste grupo (indica o quão bem você está lembrando do conteúdo nas revisões).
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </div>
                <ProgressBar value={data.baseModules.flashcardsScore} barClassName="bg-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questões</span>
                  <span className="text-green-600 dark:text-green-500">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <ScoreValue score={data.baseModules.questionsScore} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center" className="max-w-xs">
                          Percentual de acerto em questões neste grupo (acertos ÷ questões respondidas).
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </div>
                <ProgressBar value={data.baseModules.questionsScore} barClassName="bg-green-500/80" />
              </div>
            </div>

            {/* Alta Recorrência */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="font-medium text-foreground underline decoration-dotted underline-offset-2"
                        aria-label="O que significa alta recorrência?"
                      >
                        Alta Recorrência
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start" className="max-w-xs">
                      Tópicos que caem com frequência nas provas. Dar atenção a estes conteúdos costuma aumentar o retorno do seu estudo.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Flashcards</span>
                  <span className="text-yellow-600 dark:text-yellow-500">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <ScoreValue score={data.highRecurrence.flashcardsScore} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center" className="max-w-xs">
                          Percentual de desempenho em flashcards nos tópicos de alta recorrência.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </div>
                <ProgressBar value={data.highRecurrence.flashcardsScore} barClassName="bg-yellow-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questões</span>
                  <span className="text-yellow-600 dark:text-yellow-500">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <ScoreValue score={data.highRecurrence.questionsScore} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center" className="max-w-xs">
                          Percentual de acerto em questões nos tópicos de alta recorrência.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </div>
                <ProgressBar value={data.highRecurrence.questionsScore} barClassName="bg-yellow-500/80" />
              </div>
            </div>
          </div>

          {data.recommendations.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Sugestões de foco
                </h3>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                        aria-label="Como calculamos as sugestões de foco"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" className="max-w-xs" sideOffset={8}>
                      As sugestões de foco priorizam tópicos com maior importância e menor desempenho recente.
                      Elas combinam seus resultados em questões (Q) e flashcards (F) para indicar onde o estudo tende a trazer mais ganho.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                {data.recommendations.map((rec) => (
                  <div
                    key={rec.moduloId}
                    className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {rec.moduloNome}
                        </p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {rec.importancia}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.reason}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                      {rec.flashcardsScore != null && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="block underline decoration-dotted underline-offset-2"
                                aria-label="O que significa F?"
                              >
                                F: {rec.flashcardsScore}%
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" align="center" className="max-w-xs">
                              **F** é sua taxa de desempenho em flashcards deste tópico (um resumo do quão bem você está lembrando do conteúdo nas revisões).
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {rec.questionsScore != null && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="block underline decoration-dotted underline-offset-2"
                                aria-label="O que significa Q?"
                              >
                                Q: {rec.questionsScore}%
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" align="center" className="max-w-xs">
                              **Q** é sua taxa de acerto em questões deste tópico (acertos ÷ questões respondidas), em forma de percentual.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
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

