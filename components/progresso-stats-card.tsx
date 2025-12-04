'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, CheckCircle2, Circle, PlayCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { AtividadeComProgresso } from '@/app/(dashboard)/aluno/sala-de-estudos/types'

interface ProgressoStatsCardProps {
  atividades: AtividadeComProgresso[]
  totalGeral?: number
  hasFilters?: boolean
}

export function ProgressoStatsCard({
  atividades,
  totalGeral,
  hasFilters = false,
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
          </CardTitle>
          {hasFilters && totalGeral && totalGeral !== stats.total && (
            <span className="text-sm text-muted-foreground">
              de {totalGeral} totais
            </span>
          )}
        </div>
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



