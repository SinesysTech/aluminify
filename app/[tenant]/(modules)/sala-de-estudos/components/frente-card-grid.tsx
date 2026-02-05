'use client'

import * as React from 'react'
import { FrenteCard, type FrenteColorConfig } from './frente-card'
import { SimplifiedActivityList } from './simplified-activity-list'
import { FrenteComModulos, AtividadeComProgresso, ModuloComAtividades } from '../types'
import { StatusAtividade, DificuldadePercebida } from '@/app/shared/types/enums'
import { cn } from '@/lib/utils'

// Continuidade do gradiente: Disciplinas(yellow/lime) → Frentes(emerald+)
const FRENTE_PALETTE: FrenteColorConfig[] = [
  {
    accent: 'from-emerald-400 to-green-500',
    bar: '[&>div]:bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    hover: 'hover:shadow-emerald-500/8 hover:border-emerald-500/30',
    ring: 'ring-emerald-500/20 border-emerald-500/40',
    expand: 'bg-emerald-500/10',
    border: 'border-l-emerald-500',
  },
  {
    accent: 'from-teal-400 to-cyan-500',
    bar: '[&>div]:bg-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
    hover: 'hover:shadow-teal-500/8 hover:border-teal-500/30',
    ring: 'ring-teal-500/20 border-teal-500/40',
    expand: 'bg-teal-500/10',
    border: 'border-l-teal-500',
  },
  {
    accent: 'from-blue-400 to-indigo-500',
    bar: '[&>div]:bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:shadow-blue-500/8 hover:border-blue-500/30',
    ring: 'ring-blue-500/20 border-blue-500/40',
    expand: 'bg-blue-500/10',
    border: 'border-l-blue-500',
  },
  {
    accent: 'from-violet-400 to-fuchsia-500',
    bar: '[&>div]:bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
    hover: 'hover:shadow-violet-500/8 hover:border-violet-500/30',
    ring: 'ring-violet-500/20 border-violet-500/40',
    expand: 'bg-violet-500/10',
    border: 'border-l-violet-500',
  },
  {
    accent: 'from-fuchsia-400 to-pink-500',
    bar: '[&>div]:bg-fuchsia-500',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    hover: 'hover:shadow-fuchsia-500/8 hover:border-fuchsia-500/30',
    ring: 'ring-fuchsia-500/20 border-fuchsia-500/40',
    expand: 'bg-fuchsia-500/10',
    border: 'border-l-fuchsia-500',
  },
  {
    accent: 'from-sky-400 to-blue-500',
    bar: '[&>div]:bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
    hover: 'hover:shadow-sky-500/8 hover:border-sky-500/30',
    ring: 'ring-sky-500/20 border-sky-500/40',
    expand: 'bg-sky-500/10',
    border: 'border-l-sky-500',
  },
]

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
  const expandedRef = React.useRef<HTMLDivElement>(null)

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

  // Auto-scroll to expanded section on mobile
  React.useEffect(() => {
    if (expandedFrenteId && expandedRef.current) {
      requestAnimationFrame(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
  }, [expandedFrenteId])

  if (frentes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma frente disponível nesta disciplina.
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
      {frentes.map((frente, index) => {
        const stats = frenteStats.get(frente.id) || { completed: 0, total: 0 }
        const isExpanded = expandedFrenteId === frente.id
        const colorConfig = FRENTE_PALETTE[index % FRENTE_PALETTE.length]

        return (
          <React.Fragment key={frente.id}>
            <FrenteCard
              frente={frente}
              stats={stats}
              isExpanded={isExpanded}
              onToggle={() => onFrenteToggle(frente.id)}
              colorConfig={colorConfig}
            />
            {isExpanded && expandedFrenteActivities.length > 0 && (
              <div
                ref={expandedRef}
                className={cn(
                  'col-span-full',
                  'animate-in fade-in-0 slide-in-from-top-2 duration-200',
                  'border-l-2 pl-3 ml-2',
                  colorConfig.border
                )}
              >
                <SimplifiedActivityList
                  modulos={expandedFrenteActivities}
                  onStatusChange={onStatusChange}
                  onStatusChangeWithDesempenho={onStatusChangeWithDesempenho}
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
