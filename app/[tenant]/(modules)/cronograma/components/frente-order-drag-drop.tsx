'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FrenteOrderItem {
  id: string
  nome: string
  disciplinaId: string
  disciplinaNome: string
  totalModulos: number
  totalAulas: number
  tempoEstimadoMinutos: number
}

interface FrenteOrderDragDropProps {
  frentes: FrenteOrderItem[]
  onOrderChange: (orderedFrenteNames: string[]) => void
  isMultiDisciplina: boolean
}

const formatTempo = (minutes: number) => {
  const rounded = Math.max(0, Math.round(minutes))
  const hours = Math.floor(rounded / 60)
  const mins = rounded % 60

  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (mins > 0) parts.push(`${mins}min`)

  return parts.length === 0 ? '0min' : parts.join(' ')
}

function SortableFrenteCard({
  frente,
  index,
}: {
  frente: FrenteOrderItem
  index: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: frente.id })

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
        'flex items-center gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-muted/50',
        isDragging && 'shadow-md',
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Badge
        variant="secondary"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs"
      >
        {index + 1}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{frente.nome}</div>
        <div className="text-xs text-muted-foreground">
          {frente.totalModulos} {frente.totalModulos === 1 ? 'módulo' : 'módulos'} · {frente.totalAulas} {frente.totalAulas === 1 ? 'aula' : 'aulas'} · ~{formatTempo(frente.tempoEstimadoMinutos)}
        </div>
      </div>
    </div>
  )
}

function FrenteCardOverlay({ frente, index }: { frente: FrenteOrderItem; index: number }) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card p-3 shadow-lg">
      <div className="cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Badge
        variant="secondary"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs"
      >
        {index + 1}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{frente.nome}</div>
        <div className="text-xs text-muted-foreground">
          {frente.totalModulos} {frente.totalModulos === 1 ? 'módulo' : 'módulos'} · {frente.totalAulas} {frente.totalAulas === 1 ? 'aula' : 'aulas'} · ~{formatTempo(frente.tempoEstimadoMinutos)}
        </div>
      </div>
    </div>
  )
}

export function FrenteOrderDragDrop({
  frentes,
  onOrderChange,
  isMultiDisciplina,
}: FrenteOrderDragDropProps) {
  const [orderedItems, setOrderedItems] = useState<FrenteOrderItem[]>(frentes)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  // Re-initialize when frentes prop changes (e.g. user changed discipline selection)
  useEffect(() => {
    setOrderedItems(frentes)
  }, [frentes])

  // Emit order on mount and whenever orderedItems changes
  const emitOrder = useCallback(
    (items: FrenteOrderItem[]) => {
      const names = items.map((f) => f.nome)
      onOrderChange(names)
    },
    [onOrderChange],
  )

  // Emit initial order
  useEffect(() => {
    if (orderedItems.length > 0) {
      emitOrder(orderedItems)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-emit when frentes prop changes
  useEffect(() => {
    if (frentes.length > 0) {
      emitOrder(frentes)
    }
  }, [frentes]) // eslint-disable-line react-hooks/exhaustive-deps

  const disciplinaGroups = useMemo(() => {
    const groups: Record<string, { disciplinaNome: string; items: FrenteOrderItem[] }> = {}
    for (const item of orderedItems) {
      if (!groups[item.disciplinaId]) {
        groups[item.disciplinaId] = {
          disciplinaNome: item.disciplinaNome,
          items: [],
        }
      }
      groups[item.disciplinaId].items.push(item)
    }
    return groups
  }, [orderedItems])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeItem = orderedItems.find((f) => f.id === active.id)
    const overItem = orderedItems.find((f) => f.id === over.id)

    if (!activeItem || !overItem) return

    // In multi-discipline mode, only allow reordering within same discipline
    if (isMultiDisciplina && activeItem.disciplinaId !== overItem.disciplinaId) return

    setOrderedItems((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id)
      const newIndex = prev.findIndex((f) => f.id === over.id)
      const newOrder = arrayMove(prev, oldIndex, newIndex)
      emitOrder(newOrder)
      return newOrder
    })
  }

  const activeDragItem = activeDragId
    ? orderedItems.find((f) => f.id === activeDragId)
    : null

  const activeDragIndex = activeDragItem
    ? (() => {
        if (isMultiDisciplina) {
          const group = disciplinaGroups[activeDragItem.disciplinaId]
          return group ? group.items.findIndex((f) => f.id === activeDragId) : 0
        }
        return orderedItems.findIndex((f) => f.id === activeDragId)
      })()
    : 0

  if (isMultiDisciplina) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {Object.entries(disciplinaGroups).map(([discId, group]) => (
            <div key={discId} className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {group.disciplinaNome}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {group.items.length} {group.items.length === 1 ? 'frente' : 'frentes'}
                </Badge>
              </div>
              <SortableContext
                items={group.items.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {group.items.map((frente, index) => (
                    <SortableFrenteCard
                      key={frente.id}
                      frente={frente}
                      index={index}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeDragItem ? (
            <FrenteCardOverlay
              frente={activeDragItem}
              index={activeDragIndex}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedItems.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1.5">
          {orderedItems.map((frente, index) => (
            <SortableFrenteCard
              key={frente.id}
              frente={frente}
              index={index}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeDragItem ? (
          <FrenteCardOverlay
            frente={activeDragItem}
            index={activeDragIndex}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
