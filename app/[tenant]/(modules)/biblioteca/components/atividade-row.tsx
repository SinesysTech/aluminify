'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { PlayCircle, Eye, FileX, Loader2, FileText, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/app/shared/components/forms/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/components/overlay/tooltip'
import { cn } from '@/lib/utils'
import { StatusAtividade, DificuldadePercebida } from '@/app/shared/types/enums'
import { atividadeRequerDesempenho } from '@/app/shared/types/entities/activity'
import { AtividadeComProgresso } from '../types'
import { DesempenhoModal } from './desempenho-modal'
import { PdfViewerModal } from '@/components/shared/pdf-viewer-modal'
import Link from 'next/link'

interface AtividadeRowProps {
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
            // Roxo: #A78BFA
            return 'border-transparent bg-[#A78BFA] text-white'
        case 'Facil':
            // Azul: #60A5FA
            return 'border-transparent bg-[#60A5FA] text-white'
        case 'Medio':
            // Amarelo: #FACC15
            return 'border-transparent bg-[#FACC15] text-white'
        case 'Dificil':
            // Laranja: #FB923C
            return 'border-transparent bg-[#FB923C] text-white'
        case 'Muito Dificil':
            // Vermelho: #F87171
            return 'border-transparent bg-[#F87171] text-white'
        default:
            return ''
    }
}

export function AtividadeRow({
    atividade,
    onStatusChange,
    onStatusChangeWithDesempenho,
    className,
}: AtividadeRowProps) {
    const params = useParams()
    const tenant = params?.tenant as string
    const [isUpdating, setIsUpdating] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [modalOpen, setModalOpen] = React.useState(false)
    const [pdfModalOpen, setPdfModalOpen] = React.useState(false)

    const isReadOnly = !onStatusChange && !onStatusChangeWithDesempenho

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
        if (isReadOnly) return
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
        if (isReadOnly) return
        await handleStatusChange('Iniciado')
    }

    const handleVisualizar = () => {
        if (atividade.arquivoUrl) {
            setPdfModalOpen(true)
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

    const statusBadgeColor =
        isConcluido
            ? 'border-transparent bg-[#34D399] text-white' // Verde
            : isIniciado
                ? 'border-transparent bg-[#60A5FA] text-white' // Azul
                : 'border-transparent bg-[#22D3EE] text-white' // Ciano (pendente)

    return (
        <>
            <div className={cn('relative rounded-md border p-3', className)}>
                <div className="flex items-start gap-3">
                    <div className="flex items-start mt-px">
                        <Checkbox
                            checked={isConcluido}
                            onCheckedChange={handleCheckboxChange}
                            disabled={isUpdating || isReadOnly}
                            className="h-5 w-5"
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-medium">{atividade.titulo}</span>
                            <Badge variant="outline" className={cn('text-xs', statusBadgeColor)}>
                                {status}
                            </Badge>
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
                                    <TooltipProvider delayDuration={200}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge variant="outline" className="text-xs cursor-help">
                                                    <FileText className="h-3 w-3 mr-1" />
                                                    Anotações
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="right"
                                                align="start"
                                                className="max-w-xs bg-slate-900 dark:bg-slate-800 text-slate-50 border-slate-700 p-3 z-50"
                                                sideOffset={8}
                                            >
                                                <p className="text-sm">{atividade.anotacoesPessoais}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-2 shrink-0 mt-px">
                        <TooltipProvider delayDuration={200}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={`/${tenant}/foco?cursoId=${atividade.cursoId}&atividadeId=${atividade.id}&disciplinaId=${atividade.disciplinaId}&frenteId=${atividade.frenteId}&moduloId=${atividade.moduloId}`}
                                    >
                                        <Button type="button" variant="secondary" size="sm">
                                            <Timer className="h-4 w-4 mr-1" />
                                            Focar
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="left"
                                    align="start"
                                    className="max-w-xs bg-slate-900 dark:bg-slate-800 text-slate-50 border-slate-700 p-3 z-50"
                                    sideOffset={8}
                                >
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            Clique para abrir esta atividade no Modo Foco, um ambiente dedicado para estudo sem distrações.
                                        </p>
                                        <p>
                                            No Modo Foco você pode visualizar o PDF da atividade, fazer anotações e acompanhar seu tempo de estudo.
                                        </p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {isPendente && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleIniciar}
                                disabled={isUpdating || isReadOnly}
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

                        <TooltipProvider delayDuration={200}>
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
                                    <TooltipContent
                                        side="left"
                                        align="start"
                                        className="max-w-xs bg-slate-900 dark:bg-slate-800 text-slate-50 border-slate-700 p-3 z-50"
                                        sideOffset={8}
                                    >
                                        <p className="text-sm">Arquivo ainda não disponível</p>
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
                <DesempenhoModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    atividade={atividade}
                    onSave={handleSaveDesempenho}
                />
            )}

            {/* Modal de visualização de PDF */}
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
