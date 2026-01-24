'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, CheckCircle2, Circle, PlayCircle, Info } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AtividadeComProgresso } from '@/app/(dashboard)/aluno/sala-de-estudos/types'

interface ProgressoStatsCardProps {
  atividades: AtividadeComProgresso[]
  totalGeral?: number
  hasFilters?: boolean
  contexto?: {
    curso?: string | null
    disciplina?: string | null
    frente?: string | null
  }
}

export function ProgressoStatsCard({
  atividades,
  totalGeral,
  hasFilters = false,
  contexto,
}: ProgressoStatsCardProps) {
  const stats = React.useMemo(() => {
    const total = atividades.length
    const pendentes = atividades.filter((a) => !a.progressoStatus || a.progressoStatus === 'Pendente').length
    const iniciadas = atividades.filter((a) => a.progressoStatus === 'Iniciado').length
    const concluidas = atividades.filter((a) => a.progressoStatus === 'Concluido').length
    const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0

    return {
      total,
      pendentes,
      iniciadas,
      concluidas,
      percentual,
    }
  }, [atividades])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estatísticas de Progresso
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Informações sobre estatísticas de progresso"
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
                      Este card mostra um resumo do seu progresso nas atividades da sala de estudos.
                    </p>
                    <p>
                      As estatísticas são calculadas com base no status de cada atividade: pendente, iniciada ou concluída.
                    </p>
                    <p>
                      O percentual de progresso geral mostra quantas atividades você já concluiu em relação ao total disponível.
                    </p>
                    {hasFilters && (
                      <p>
                        Quando há filtros ativos, as estatísticas mostram apenas as atividades que correspondem aos filtros selecionados.
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          {hasFilters && totalGeral && totalGeral !== stats.total && (
            <span className="text-sm text-muted-foreground">
              de {totalGeral} totais
            </span>
          )}
        </div>
        {contexto && (contexto.curso || contexto.disciplina || contexto.frente) && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {contexto.curso && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-muted/50">
                Curso: <span className="font-medium text-foreground">{contexto.curso}</span>
              </span>
            )}
            {contexto.disciplina && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-muted/50">
                Disciplina: <span className="font-medium text-foreground">{contexto.disciplina}</span>
              </span>
            )}
            {contexto.frente && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-muted/50">
                Frente: <span className="font-medium text-foreground">{contexto.frente}</span>
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {stats.pendentes}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Circle className="h-3 w-3" />
                Pendentes
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.iniciadas}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <PlayCircle className="h-3 w-3" />
                Iniciadas
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.concluidas}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Concluídas
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso Geral</span>
              <span className="font-medium">{stats.percentual}%</span>
            </div>
            <Progress value={stats.percentual} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



