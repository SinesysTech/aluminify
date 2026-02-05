'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
        Nenhuma atividade disponível.
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Accordion type="multiple" defaultValue={[]} className="space-y-4">
        {modulos.map((modulo) => {
          const completedCount = modulo.atividades.filter(
            (a: AtividadeComProgresso) => a.progressoStatus === 'Concluido'
          ).length
          const totalCount = modulo.atividades.length

          return (
            <AccordionItem
              key={modulo.id}
              value={modulo.id}
              className="border rounded-2xl overflow-hidden bg-card text-card-foreground border-b dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5"
            >
              <AccordionTrigger className="py-3 px-4 bg-muted/20 hover:no-underline hover:bg-muted/30 dark:bg-muted/10 dark:hover:bg-muted/20 data-[state=open]:rounded-none transition-colors">
                <div className="flex items-center justify-between w-full text-left">
                  <span className="text-sm font-medium">
                    {modulo.numeroModulo ? `Módulo ${modulo.numeroModulo}: ` : ''}
                    {modulo.nome}
                  </span>
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full tabular-nums shrink-0 ml-2 font-medium',
                    completedCount === totalCount && totalCount > 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {completedCount}/{totalCount}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="divide-y divide-border/50 p-2">
                  {modulo.atividades.map((atividade: AtividadeComProgresso) => (
                    <SimplifiedActivityRow
                      key={atividade.id}
                      atividade={atividade}
                      onStatusChange={onStatusChange}
                      onStatusChangeWithDesempenho={onStatusChangeWithDesempenho}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
