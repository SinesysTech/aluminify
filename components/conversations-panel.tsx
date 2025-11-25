'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, MessageSquare, X } from 'lucide-react'
import { ConversationListItem } from './conversation-list-item'
import { RenameConversationDialog } from './rename-conversation-dialog'
import type { Conversation } from '@/backend/services/conversation/conversation.types'
import { cn } from '@/lib/utils'

interface ConversationsPanelProps {
  selectedConversationId: string | null
  onSelectConversation: (conversation: Conversation | null) => void
  onConversationUpdated: () => void
  accessToken: string | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ConversationsPanel({
  selectedConversationId,
  onSelectConversation,
  onConversationUpdated,
  accessToken,
  open = true,
  onOpenChange,
}: ConversationsPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [conversationToRename, setConversationToRename] = useState<Conversation | null>(null)

  const loadConversations = async () => {
    if (!accessToken) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('[ConversationsPanel] Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [accessToken])

  const handleCreateConversation = async () => {
    if (!accessToken) return

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: 'Nova Conversa',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        await loadConversations()
        // Selecionar a nova conversa
        if (data.conversation) {
          onSelectConversation(data.conversation)
        }
        onConversationUpdated()
      }
    } catch (error) {
      console.error('[ConversationsPanel] Error creating conversation:', error)
    }
  }

  const handleRename = (conversation: Conversation) => {
    setConversationToRename(conversation)
    setRenameDialogOpen(true)
  }

  const handleDelete = async (conversationId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        await loadConversations()
        // Se a conversa deletada estava selecionada, limpar seleção
        if (selectedConversationId === conversationId) {
          onSelectConversation(null)
        }
        onConversationUpdated()
      }
    } catch (error) {
      console.error('[ConversationsPanel] Error deleting conversation:', error)
    }
  }

  const handlePin = async (conversationId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          is_active: true,
        }),
      })

      if (response.ok) {
        await loadConversations()
        onConversationUpdated()
      }
    } catch (error) {
      console.error('[ConversationsPanel] Error pinning conversation:', error)
    }
  }

  const handleRenameComplete = async () => {
    setRenameDialogOpen(false)
    setConversationToRename(null)
    await loadConversations()
    onConversationUpdated()
  }

  return (
    <>
      <div
        className={cn(
          'flex flex-col h-full border-r bg-background transition-all duration-300',
          open ? 'w-full md:w-64' : 'w-0 overflow-hidden'
        )}
      >
        {open && (
          <>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Conversas</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCreateConversation}
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Nova conversa</span>
                </Button>
                {onOpenChange && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fechar</span>
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {isLoading ? (
                  <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>Carregando...</span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                    <p>Nenhuma conversa ainda</p>
                    <p className="text-xs mt-1">Crie uma nova conversa para começar</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => (
                      <ConversationListItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversationId === conversation.id}
                        onSelect={() => onSelectConversation(conversation)}
                        onRename={() => handleRename(conversation)}
                        onDelete={() => handleDelete(conversation.id)}
                        onPin={() => handlePin(conversation.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {conversationToRename && (
        <RenameConversationDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          conversation={conversationToRename}
          accessToken={accessToken}
          onRenameComplete={handleRenameComplete}
        />
      )}
    </>
  )
}

