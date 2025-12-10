'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { format, addDays } from 'date-fns'
import { GripVertical } from 'lucide-react'
import { createClient } from '@/lib/client'
import { cn } from '@/lib/utils'

interface CronogramaItem {
  id: string
  aula_id: string
  semana_numero: number
  ordem_na_semana: number
  concluido: boolean
  data_conclusao: string | null
  aulas: {
    id: string
    nome: string
    numero_aula: number | null
    tempo_estimado_minutos: number | null
    modulos: {
      id: string
      nome: string
      numero_modulo: number | null
      frentes: {
        id: string
        nome: string
        disciplinas: {
          id: string
          nome: string
        }
      }
    }
  } | null
}

interface ScheduleListProps {
  itensPorSemana: Record<number, CronogramaItem[]>
  dataInicio: string
  dataFim: string
  periodosFerias: Array<{ inicio: string; fim: string }>
  modalidade: 'paralelo' | 'sequencial'
  cronogramaId: string
  onToggleConcluido: (itemId: string, concluido: boolean) => void
  onUpdate: (updater: (prev: Record<number, CronogramaItem[]>) => Record<number, CronogramaItem[]>) => void
}

const formatTempo = (minutes: number) => {
  const rounded = Math.max(0, Math.round(minutes))
  const hours = Math.floor(rounded / 60)
  const mins = rounded % 60

  const parts = []
  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (mins > 0) {
    parts.push(`${mins} min`)
  }

  if (parts.length === 0) {
    return '0 min'
  }

  return parts.join(' ')
}

function AulaItem({
  item,
  onToggleConcluido,
}: {
  item: CronogramaItem
  onToggleConcluido: (itemId: string, concluido: boolean) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 p-2 border rounded hover:bg-muted/50 transition-colors",
        item.concluido && "opacity-60"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Checkbox
        checked={item.concluido}
        onCheckedChange={(checked) =>
          onToggleConcluido(item.id, checked as boolean)
        }
        className="mt-1"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0">
        {item.aulas ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                Aula {item.aulas.numero_aula || 'N/A'}
              </Badge>
              {item.aulas.modulos?.numero_modulo && (
                <Badge variant="secondary" className="text-xs">
                  Módulo {item.aulas.modulos.numero_modulo}
                </Badge>
              )}
              {item.aulas.modulos?.frentes?.nome && (
                <Badge variant="outline" className="text-xs">
                  {item.aulas.modulos.frentes.nome}
                </Badge>
              )}
            </div>
            <div className="font-medium text-sm mb-1">
              {item.aulas.nome}
            </div>
            <div className="text-xs text-muted-foreground">
              {item.aulas.tempo_estimado_minutos && item.aulas.tempo_estimado_minutos > 0
                ? formatTempo(item.aulas.tempo_estimado_minutos)
                : 'Duração não informada'}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Aula não disponível (ID: {item.aula_id})
          </div>
        )}
      </div>
    </div>
  )
}

export function ScheduleList({
  itensPorSemana,
  dataInicio,
  dataFim,
  periodosFerias,
  modalidade,
  cronogramaId: _cronogramaId,
  onToggleConcluido,
  onUpdate,
}: ScheduleListProps) {
  void _cronogramaId // Marked as intentionally unused
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Calcular todas as semanas do período (data_inicio até data_fim)
  const dataInicioDate = new Date(dataInicio)
  const dataFimDate = new Date(dataFim)
  const todasSemanas: number[] = []
  let semanaNumero = 1
  const dataAtual = new Date(dataInicioDate)

  while (dataAtual <= dataFimDate) {
    todasSemanas.push(semanaNumero)
    dataAtual.setDate(dataAtual.getDate() + 7)
    semanaNumero++
  }

  // Usar todas as semanas, não apenas as que têm itens
  const semanas = todasSemanas

  const getSemanaDates = (semanaNumero: number) => {
    const inicio = new Date(dataInicio)
    const inicioSemana = addDays(inicio, (semanaNumero - 1) * 7)
    const fimSemana = addDays(inicioSemana, 6)
    return { inicioSemana, fimSemana }
  }

  // Verificar se uma semana é período de férias
  const isSemanaFerias = (semanaNumero: number): boolean => {
    const { inicioSemana, fimSemana } = getSemanaDates(semanaNumero)
    
    for (const periodo of periodosFerias || []) {
      const inicioFerias = new Date(periodo.inicio)
      const fimFerias = new Date(periodo.fim)
      
      // Verificar se a semana se sobrepõe ao período de férias
      if (
        (inicioSemana >= inicioFerias && inicioSemana <= fimFerias) ||
        (fimSemana >= inicioFerias && fimSemana <= fimFerias) ||
        (inicioSemana <= inicioFerias && fimSemana >= fimFerias)
      ) {
        return true
      }
    }
    return false
  }

  // Encontrar a última semana com aulas
  const semanasComAulas = Object.keys(itensPorSemana)
    .map(Number)
    .filter(semana => (itensPorSemana[semana] || []).length > 0)
  
  const ultimaSemanaComAulas = semanasComAulas.length > 0 
    ? Math.max(...semanasComAulas) 
    : 0

  // Verificar se o cronograma terminou antes do tempo disponível
  const cronogramaTerminouAntes = ultimaSemanaComAulas > 0 && ultimaSemanaComAulas < semanas.length

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const itemId = active.id as string
    const overId = over.id as string

    // Encontrar o item atual e sua semana
    let itemAtual: CronogramaItem | null = null
    let semanaAtual = 0

    for (const [semana, itens] of Object.entries(itensPorSemana)) {
      const item = itens.find((i) => i.id === itemId)
      if (item) {
        itemAtual = item
        semanaAtual = Number(semana)
        break
      }
    }

    if (!itemAtual) return

    // Verificar se está sendo arrastado para outro item (reordenação)
    const itemSobre = Object.values(itensPorSemana)
      .flat()
      .find((i) => i.id === overId)

    if (itemSobre && itemSobre.semana_numero === semanaAtual) {
      // Reordenação dentro da mesma semana
      const itens = [...itensPorSemana[semanaAtual]]
      const oldIndex = itens.findIndex((i) => i.id === itemId)
      const newIndex = itens.findIndex((i) => i.id === overId)

      if (oldIndex !== newIndex && newIndex !== -1) {
        const newItems = arrayMove(itens, oldIndex, newIndex)
        const itensAtualizados = newItems.map((item, index) => ({
          ...item,
          ordem_na_semana: index + 1,
        }))

        // Atualizar no banco
        const supabase = createClient()
        for (const item of itensAtualizados) {
          await supabase
            .from('cronograma_itens')
            .update({ ordem_na_semana: item.ordem_na_semana })
            .eq('id', item.id)
        }

        // Atualizar estado local
        onUpdate((prev: any) => {
          if (!prev) return prev
          return {
            ...prev,
            cronograma_itens: prev.cronograma_itens.map((item: CronogramaItem) => {
              const updated = itensAtualizados.find((i) => i.id === item.id)
              return updated || item
            }),
          }
        })
      }
    }
  }

  const activeItem = activeId
    ? Object.values(itensPorSemana)
        .flat()
        .find((item) => item.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Accordion type="multiple" className="w-full">
        {semanas.map((semana) => {
          const itens = itensPorSemana[semana] || []
          const concluidos = itens.filter((item) => item.concluido).length
          const { inicioSemana, fimSemana } = getSemanaDates(semana)

          const temAulas = itens && itens.length > 0
          const isFerias = isSemanaFerias(semana)
          const isAposTermino = cronogramaTerminouAntes && semana > ultimaSemanaComAulas

          // Para modo sequencial, não agrupar por frente
          const itensOrdenados = [...itens].sort((a, b) => a.ordem_na_semana - b.ordem_na_semana)

          return (
            <AccordionItem key={semana} value={`semana-${semana}`}>
              <AccordionTrigger>
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      Semana {semana} ({format(inicioSemana, 'dd/MM')} - {format(fimSemana, 'dd/MM')})
                    </span>
                    {!temAulas && isFerias && (
                      <Badge variant="secondary" className="text-xs">
                        Período de Descanso
                      </Badge>
                    )}
                    {!temAulas && isAposTermino && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Já acabou? Então bora pra revisão!
                      </Badge>
                    )}
                  </div>
                  {temAulas && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex flex-col items-end gap-1">
                        <span>
                          {concluidos} de {itens.length} aulas
                        </span>
                        {(() => {
                          const tempoAulas = itens.reduce((acc, item) => {
                            return acc + (item.aulas?.tempo_estimado_minutos || 0)
                          }, 0)
                          const tempoAnotacoesExercicios = tempoAulas * 0.5
                          const tempoTotal = tempoAulas + tempoAnotacoesExercicios
                          return (
                            <span className="text-xs">
                                {formatTempo(tempoTotal)}
                            </span>
                          )
                        })()}
                      </div>
                      <Progress
                        value={(concluidos / itens.length) * 100}
                        className="w-24 h-2"
                      />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 space-y-4">
                  {temAulas && (
                    <div className="bg-muted/50 p-3 rounded-lg border">
                      <h4 className="font-semibold text-sm mb-2">Previsão de Tempo - Semana {semana}</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Aulas:</span>
                          <p className="font-medium">
                            {formatTempo(
                              itens.reduce(
                                (acc, item) => acc + (item.aulas?.tempo_estimado_minutos || 0),
                                0,
                              ),
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Anotações/Exercícios:</span>
                          <p className="font-medium">
                            {formatTempo(
                              itens.reduce(
                                (acc, item) => acc + (item.aulas?.tempo_estimado_minutos || 0),
                                0,
                              ) * 0.5,
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <p className="font-semibold">
                            {formatTempo(
                              itens.reduce(
                                (acc, item) => acc + (item.aulas?.tempo_estimado_minutos || 0),
                                0,
                              ) * 1.5,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {!temAulas ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {isFerias ? (
                        <p>Período de descanso - Nenhuma aula agendada</p>
                      ) : isAposTermino ? (
                        <div className="space-y-2">
                          <p className="font-semibold text-green-700">Já acabou? Então bora pra revisão!</p>
                          <p className="text-sm">Você concluiu todas as aulas do cronograma antes do previsto. Use este tempo para revisar o conteúdo estudado!</p>
                        </div>
                      ) : (
                        <p>Nenhuma aula agendada para esta semana</p>
                      )}
                    </div>
                  ) : modalidade === 'sequencial' ? (
                    // Modo sequencial: lista simples sem divisões de frentes
                    <SortableContext
                      items={itensOrdenados.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {itensOrdenados.map((item) => (
                          <AulaItem
                            key={item.id}
                            item={item}
                            onToggleConcluido={onToggleConcluido}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  ) : (
                    // Modo paralelo: agrupar por frente
                    (() => {
                      const itensPorFrente = itensOrdenados.reduce((acc, item) => {
                        const frenteId = item.aulas?.modulos?.frentes?.id || 'sem-frente'
                        const frenteNome = item.aulas?.modulos?.frentes?.nome || 'Sem Frente'

                        if (!acc[frenteId]) {
                          acc[frenteId] = {
                            nome: frenteNome,
                            disciplina: item.aulas?.modulos?.frentes?.disciplinas?.nome || '',
                            itens: [],
                          }
                        }
                        acc[frenteId].itens.push(item)
                        return acc
                      }, {} as Record<string, { nome: string; disciplina: string; itens: CronogramaItem[] }>)

                      const frentes = Object.values(itensPorFrente)

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {frentes.map((frente, frenteIndex) => (
                            <Card key={frenteIndex} className="border rounded-lg p-4 bg-card">
                              <div className="mb-3 pb-2 border-b">
                                <h4 className="font-semibold text-sm">{frente.nome}</h4>
                                {frente.disciplina && (
                                  <p className="text-xs text-muted-foreground">{frente.disciplina}</p>
                                )}
                              </div>
                              <SortableContext
                                items={frente.itens.map((item) => item.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-2">
                                  {frente.itens.map((item) => (
                                    <AulaItem
                                      key={item.id}
                                      item={item}
                                      onToggleConcluido={onToggleConcluido}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </Card>
                          ))}
                        </div>
                      )
                    })()
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
      <DragOverlay>
        {activeItem ? (
          <Card className="w-full">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                {activeItem.aulas && (
                  <div className="flex-1">
                    <Badge variant="outline" className="text-xs mb-1">
                      Aula {activeItem.aulas.numero_aula || 'N/A'}
                    </Badge>
                    <p className="text-sm font-medium">{activeItem.aulas.nome}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
