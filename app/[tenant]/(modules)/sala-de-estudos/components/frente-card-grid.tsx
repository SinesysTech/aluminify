'use client'

import * as React from 'react'
import { FrenteCard } from './frente-card'
import { SimplifiedActivityList } from './simplified-activity-list'
import { FrenteComModulos, AtividadeComProgresso, ModuloComAtividades } from '../types'
import { StatusAtividade, DificuldadePercebida } from '@/app/shared/types/enums'
import { cn } from '@/lib/utils'

interface FrenteCardGridProps {
  frentes: FrenteComModulos[]
  frenteStats: Map<string, { completed: number; total: number }>
  atividades: AtividadeComProgresso[]
  expandedFrenteId: string | null
  onFrenteToggle: (frenteId: string) => void
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

export function FrenteCardGrid({
  frentes,
  frenteStats,
  atividades,
  expandedFrenteId,
  onFrenteToggle,
  onStatusChange,
  onStatusChangeWithDesempenho,
  className,
}: FrenteCardGridProps) {
  // Get activities for expanded frente, grouped by module
  const expandedFrenteActivities = React.useMemo(() => {
    if (!expandedFrenteId) return []

    const frente = frentes.find(f => f.id === expandedFrenteId)
    if (!frente) return []

    // Build activities grouped by module
    const modulosWithActivities: ModuloComAtividades[] = frente.modulos.map(modulo => ({
      ...modulo,
      atividades: atividades.filter(a => a.moduloId === modulo.id)
    })).filter(m => m.atividades.length > 0)

    return modulosWithActivities
  }, [expandedFrenteId, frentes, atividades])

  if (frentes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma frente disponivel nesta disciplina.
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grid of frente cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {frentes.map((frente) => {
          const stats = frenteStats.get(frente.id) || { completed: 0, total: 0 }
          const isExpanded = expandedFrenteId === frente.id

          return (
            <FrenteCard
              key={frente.id}
              frente={frente}
              stats={stats}
              isExpanded={isExpanded}
              onToggle={() => onFrenteToggle(frente.id)}
            />
          )
        })}
      </div>

      {/* Expanded activities section */}
      {expandedFrenteId && expandedFrenteActivities.length > 0 && (
        <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <SimplifiedActivityList
            modulos={expandedFrenteActivities}
            onStatusChange={onStatusChange}
            onStatusChangeWithDesempenho={onStatusChangeWithDesempenho}
          />
        </div>
      )}
    </div>
  )
}
