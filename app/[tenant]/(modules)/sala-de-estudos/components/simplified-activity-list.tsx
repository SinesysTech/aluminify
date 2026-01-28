'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SimplifiedActivityRow } from './simplified-activity-row'
import { ModuloComAtividades, AtividadeComProgresso } from '../types'
import { StatusAtividade, DificuldadePercebida } from '@/app/shared/types/enums'
import { cn } from '@/lib/utils'

interface SimplifiedActivityListProps {
  modulos: ModuloComAtividades[]
  onStatusChange?: (atividadeId: string, status: StatusAtividade) => Promise<void>
  onStatusChangeWithDesempenho?: (
    atividadeId: string,
    status: StatusAtividade,
    desempenho: {
      questoesTotais: number
      questoesAcertos: number
      dificuldadePercebida: DificuldadePercebida
      anotacoesPessoais?: string | null
    }
  ) => Promise<void>
  className?: string
}

export function SimplifiedActivityList({
  modulos,
  onStatusChange,
  onStatusChangeWithDesempenho,
  className,
}: SimplifiedActivityListProps) {
  if (modulos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma atividade disponivel.
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {modulos.map((modulo) => {
        const completedCount = modulo.atividades.filter(
          (a: AtividadeComProgresso) => a.progressoStatus === 'Concluido'
        ).length
        const totalCount = modulo.atividades.length

        return (
          <Card key={modulo.id} className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {modulo.numeroModulo ? `Modulo ${modulo.numeroModulo}: ` : ''}
                  {modulo.nome}
                </CardTitle>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {completedCount}/{totalCount}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="divide-y divide-border/50">
                {modulo.atividades.map((atividade: AtividadeComProgresso) => (
                  <SimplifiedActivityRow
                    key={atividade.id}
                    atividade={atividade}
                    onStatusChange={onStatusChange}
                    onStatusChangeWithDesempenho={onStatusChangeWithDesempenho}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
