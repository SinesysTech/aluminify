'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { AtividadeRow } from './atividade-row'
import { ModuloComAtividades } from '../types'
import { StatusAtividade, DificuldadePercebida } from '@/app/shared/types/enums'

interface ContentListProps {
    modulo: ModuloComAtividades
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
}

export function ContentList({
    modulo,
    onStatusChange,
    onStatusChangeWithDesempenho,
}: ContentListProps) {
    const atividadesConcluidas = modulo.atividades.filter(
        (a) => a.progressoStatus === 'Concluido',
    ).length
    const totalAtividades = modulo.atividades.length
    const percentual = totalAtividades > 0 ? Math.round((atividadesConcluidas / totalAtividades) * 100) : 0

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={modulo.id} className="border rounded-lg mb-2">
                <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">
                                Módulo {modulo.numeroModulo || 'N/A'}: {modulo.nome}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {atividadesConcluidas}/{totalAtividades} atividades concluídas ({percentual}%)
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2 mt-2">
                        {modulo.atividades.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhuma atividade disponível
                            </p>
                        ) : (
                            modulo.atividades.map((atividade) => (
                                <AtividadeRow
                                    key={atividade.id}
                                    atividade={atividade}
                                    onStatusChange={onStatusChange}
                                    onStatusChangeWithDesempenho={onStatusChangeWithDesempenho}
                                />
                            ))
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
