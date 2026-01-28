'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MoreVertical, Timer, PlayCircle, Eye, FileX, CheckCircle, FileText, Video, BookOpen, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/shared/components/overlay/dropdown-menu'
import { cn } from '@/lib/utils'
import { StatusAtividade, DificuldadePercebida, TipoAtividade } from '@/app/shared/types/enums'
import { atividadeRequerDesempenho } from '@/app/shared/types/entities/activity'
import { AtividadeComProgresso } from '../types'
import { StatusIndicator } from './status-indicator'
import { RegistrarDesempenhoModal } from './registrar-desempenho-modal'
import { PdfViewerModal } from '@/components/shared/pdf-viewer-modal'

interface SimplifiedActivityRowProps {
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

function getActivityIcon(tipo: TipoAtividade) {
  switch (tipo) {
    case 'Videoaula':
      return Video
    case 'Lista de Exercicios':
    case 'Simulado':
      return FileText
    case 'Leitura':
      return BookOpen
    default:
      return HelpCircle
  }
}

function getTipoBadgeClass(tipo: TipoAtividade) {
  switch (tipo) {
    case 'Videoaula':
      return 'bg-violet-500/10 text-violet-600 border-violet-500/20'
    case 'Lista de Exercicios':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    case 'Simulado':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    case 'Leitura':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function SimplifiedActivityRow({
  atividade,
  onStatusChange,
  onStatusChangeWithDesempenho,
  className,
}: SimplifiedActivityRowProps) {
  const params = useParams()
  const tenant = params?.tenant as string
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [pdfModalOpen, setPdfModalOpen] = React.useState(false)

  const isReadOnly = !onStatusChange && !onStatusChangeWithDesempenho

  const status = atividade.progressoStatus || 'Pendente'
  const precisaModal = atividadeRequerDesempenho(atividade.tipo)
  const hasFile = !!atividade.arquivoUrl
  const isConcluido = status === 'Concluido'
  const isPendente = status === 'Pendente'

  const ActivityIcon = getActivityIcon(atividade.tipo)

  const handleStatusChange = async (newStatus: StatusAtividade) => {
    if (!onStatusChange || isUpdating) return

    setIsUpdating(true)
    try {
      await onStatusChange(atividade.id, newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleQuickComplete = async () => {
    if (isReadOnly || isUpdating) return

    if (isConcluido) {
      // Desmarcar: volta para Pendente
      await handleStatusChange('Pendente')
      return
    }

    // Marcar como concluido
    if (precisaModal) {
      setModalOpen(true)
    } else {
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
      throw new Error('Funcao de conclusao com desempenho nao fornecida')
    }

    setIsUpdating(true)
    try {
      await onStatusChangeWithDesempenho(atividade.id, 'Concluido', desempenho)
      setModalOpen(false)
    } finally {
      setIsUpdating(false)
    }
  }

  const focoHref = `/${tenant}/foco?cursoId=${atividade.cursoId}&atividadeId=${atividade.id}&disciplinaId=${atividade.disciplinaId}&frenteId=${atividade.frenteId}&moduloId=${atividade.moduloId}`

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-3 p-3 rounded-lg',
          'hover:bg-muted/50 transition-colors duration-200',
          isConcluido && 'bg-emerald-500/5',
          className
        )}
      >
        {/* Status Indicator */}
        <StatusIndicator
          status={status}
          onClick={isReadOnly ? undefined : handleQuickComplete}
          disabled={isReadOnly}
          loading={isUpdating}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {/* Icon */}
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            getTipoBadgeClass(atividade.tipo)
          )}>
            <ActivityIcon className="h-4 w-4" />
          </div>

          {/* Title + Badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-medium truncate',
                  isConcluido && 'text-muted-foreground line-through'
                )}
                title={atividade.titulo}
              >
                {atividade.titulo}
              </span>
            </div>
            {/* Performance badges when completed */}
            {isConcluido && atividade.questoesTotais && atividade.questoesTotais > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] h-5">
                  {atividade.questoesAcertos}/{atividade.questoesTotais} acertos
                </Badge>
                {atividade.dificuldadePercebida && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    {atividade.dificuldadePercebida}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Acoes</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={focoHref} className="cursor-pointer">
                <Timer className="h-4 w-4 mr-2" />
                Modo Foco
              </Link>
            </DropdownMenuItem>

            {isPendente && !isReadOnly && (
              <DropdownMenuItem
                onClick={() => handleStatusChange('Iniciado')}
                disabled={isUpdating}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Iniciar
              </DropdownMenuItem>
            )}

            {!isConcluido && !isReadOnly && (
              <DropdownMenuItem
                onClick={handleQuickComplete}
                disabled={isUpdating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Concluido
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {hasFile ? (
              <DropdownMenuItem onClick={() => setPdfModalOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar PDF
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled>
                <FileX className="h-4 w-4 mr-2" />
                PDF nao disponivel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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

      {/* Modal de visualizacao de PDF */}
      {hasFile && (
        <PdfViewerModal
          open={pdfModalOpen}
          onOpenChange={setPdfModalOpen}
          pdfUrl={atividade.arquivoUrl!}
          title={atividade.titulo}
        />
      )}
    </>
  )
}
