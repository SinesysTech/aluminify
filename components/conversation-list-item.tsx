'use client'

import { useState } from 'react'
import { MessageSquare, Pin, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { Conversation } from '@/backend/services/conversation/conversation.types'
import { cn } from '@/lib/utils'

interface ConversationListItemProps {
  conversation: Conversation
  isSelected: boolean
  onSelect: () => void
  onRename: () => void
  onDelete: () => void
  onPin: () => void
}

export function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  onPin,
}: ConversationListItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-accent',
        isSelected && 'bg-accent font-medium'
      )}
    >
      <button
        onClick={onSelect}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        {conversation.is_active && (
          <Pin className="h-3 w-3 shrink-0 text-primary" fill="currentColor" />
        )}
        <MessageSquare className="h-4 w-4 shrink-0" />
        <span className="truncate flex-1">{conversation.title}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDate(conversation.updated_at)}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Mais opções</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!conversation.is_active && (
            <>
              <DropdownMenuItem onClick={onPin}>
                <Pin className="h-4 w-4 mr-2" />
                Fixar conversa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="h-4 w-4 mr-2" />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}


