'use client'

import * as React from 'react'
import { CheckCircle2, Circle, PlayCircle, Eye, FileX, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { StatusAtividade, DificuldadePercebida } from '@/backend/services/progresso-atividade'
import { atividadeRequerDesempenho } from '@/backend/services/atividade'
import { AtividadeComProgresso } from '@/app/(dashboard)/aluno/sala-de-estudos/types'
import { RegistrarDesempenhoModal } from './registrar-desempenho-modal'

interface AtividadeChecklistRowProps {
  atividade: AtividadeComProgresso
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

function getDificuldadeColor(dificuldade: DificuldadePercebida): string {
  switch (dificuldade) {
    case 'Muito Facil':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'Facil':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'Medio':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'Dificil':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'Muito Dificil':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return ''
  }
}

export function AtividadeChecklistRow({
  atividade,
  onStatusChange,
  onStatusChangeWithDesempenho,
  className,
}: AtividadeChecklistRowProps) {
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)

  const status = atividade.progressoStatus || 'Pendente'
  const precisaModal = atividadeRequerDesempenho(atividade.tipo)

  const handleStatusChange = async (newStatus: StatusAtividade) => {
    if (!onStatusChange) return
    if (isUpdating) return

    setError(null)
    setIsUpdating(true)

    try {
      await onStatusChange(atividade.id, newStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCheckboxChange = async (checked: boolean) => {
    if (isUpdating) return

    if (!checked) {
      // Desmarcar: volta para Pendente (sem modal)
      await handleStatusChange('Pendente')
      return
    }

    // Marcar como concluído
    if (precisaModal) {
      // Check qualificado: abrir modal
      setModalOpen(true)
    } else {
      // Check simples: salvar direto
      await handleStatusChange('Concluido')
    }
  }

  const handleSaveDesempenho = async (desempenho: {
    questoesTotais: number
    questoesAcertos: number
    dificuldadePercebida: DificuldadePercebida
    anotacoesPessoais?: string | null
  }) => {
    if (!onStatusChangeWithDesempenho) {
      throw new Error('Função de conclusão com desempenho não fornecida')
    }

    setError(null)
    setIsUpdating(true)

    try {
      await onStatusChangeWithDesempenho(atividade.id, 'Concluido', desempenho)
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar desempenho')
      throw err // Re-throw para o modal tratar
    } finally {
      setIsUpdating(false)
    }
  }

  const handleIniciar = async () => {
    await handleStatusChange('Iniciado')
  }

  const handleVisualizar = () => {
    if (atividade.arquivoUrl) {
      window.open(atividade.arquivoUrl, '_blank')
    }
  }

  const hasFile = !!atividade.arquivoUrl
  const isConcluido = status === 'Concluido'
  const isIniciado = status === 'Iniciado'
  const isPendente = status === 'Pendente'

  // Verificar se tem dados de desempenho
  const temDesempenho =
    isConcluido &&
    atividade.questoesTotais !== null &&
    atividade.questoesTotais !== undefined &&
    atividade.questoesTotais > 0

  const statusIcon = isConcluido ? (
    <CheckCircle2 className="h-5 w-5 text-green-500" />
  ) : isIniciado ? (
    <PlayCircle className="h-5 w-5 text-blue-500" />
  ) : (
    <Circle className="h-5 w-5 text-muted-foreground" />
  )

  const statusBadgeColor =
    isConcluido
      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
      : isIniciado
        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
        : 'bg-gray-500/10 text-gray-700 dark:text-gray-400'

  return (
    <>
      <div className={cn('relative rounded-md border p-3', className)}>
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              checked={isConcluido}
              onCheckedChange={handleCheckboxChange}
              disabled={isUpdating}
              className="h-5 w-5"
            />
            {statusIcon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{atividade.titulo}</span>
              <Badge variant="outline" className={cn('text-xs', statusBadgeColor)}>
                {status}
              </Badge>
              <span className="text-xs text-muted-foreground">({atividade.tipo})</span>
            </div>

            {(isIniciado || isConcluido) && atividade.progressoDataInicio && (
              <p className="text-xs text-muted-foreground mt-1">
                Iniciado em: {new Date(atividade.progressoDataInicio).toLocaleDateString('pt-BR')}
              </p>
            )}

            {isConcluido && atividade.progressoDataConclusao && (
              <p className="text-xs text-muted-foreground">
                Concluído em: {new Date(atividade.progressoDataConclusao).toLocaleDateString('pt-BR')}
              </p>
            )}

            {/* Badges com métricas de desempenho */}
            {temDesempenho && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  Acertos: {atividade.questoesAcertos}/{atividade.questoesTotais}
                </Badge>
                {atividade.dificuldadePercebida && (
                  <Badge
                    variant="outline"
                    className={cn('text-xs', getDificuldadeColor(atividade.dificuldadePercebida))}
                  >
                    {atividade.dificuldadePercebida}
                  </Badge>
                )}
                {atividade.anotacoesPessoais && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs cursor-help">
                          <FileText className="h-3 w-3 mr-1" />
                          Anotações
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{atividade.anotacoesPessoais}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPendente && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleIniciar}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Iniciar
                  </>
                )}
              </Button>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {hasFile ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleVisualizar}
                      disabled={isUpdating}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar PDF
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled
                      className="opacity-50"
                    >
                      <FileX className="h-4 w-4 mr-2" />
                      PDF não disponível
                    </Button>
                  )}
                </TooltipTrigger>
                {!hasFile && (
                  <TooltipContent>
                    <p>Arquivo ainda não disponível</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {error && (
          <div className="mt-2 rounded-md bg-destructive/15 p-2 text-xs text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Modal de registro de desempenho */}
      {precisaModal && (
        <RegistrarDesempenhoModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          atividade={atividade}
          onSave={handleSaveDesempenho}
        />
      )}
    </>
  )
}
