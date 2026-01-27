'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, MessageSquare } from 'lucide-react'
import { ConversationItem } from './conversation-item'
import { RenameConversationDialog } from './rename-conversation-dialog'
import type { Conversation } from '@/app/[tenant]/(modules)/agente/services/conversation/conversation.types'
import { ListSkeleton } from '@/components/ui/list-skeleton'

interface ConversationsSidebarProps {
  selectedConversationId: string | null
  onSelectConversation: (conversation: Conversation | null) => void
  onConversationUpdated: () => void
  accessToken: string | null
}

export function ConversationsSidebar({
  selectedConversationId,
  onSelectConversation,
  onConversationUpdated,
  accessToken,
}: ConversationsSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [conversationToRename, setConversationToRename] = useState<Conversation | null>(null)

  const loadConversations = async () => {
    if (!accessToken) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/tobias/conversations', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('[ConversationsSidebar] Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const handleCreateConversation = async () => {
    if (!accessToken) return

    try {
      const response = await fetch('/api/tobias/conversations', {
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
      console.error('[ConversationsSidebar] Error creating conversation:', error)
    }
  }

  const handleRename = (conversation: Conversation) => {
    setConversationToRename(conversation)
    setRenameDialogOpen(true)
  }

  const handleDelete = async (conversationId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`/api/tobias/conversations/${conversationId}`, {
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
      console.error('[ConversationsSidebar] Error deleting conversation:', error)
    }
  }

  const handlePin = async (conversationId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`/api/tobias/conversations/${conversationId}`, {
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
      console.error('[ConversationsSidebar] Error pinning conversation:', error)
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
      <Sidebar className="w-64 border-r">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Conversas</h2>
            <Button
              size="icon"
              variant="outline"
              onClick={handleCreateConversation}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Nova conversa</span>
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <SidebarGroup>
              <SidebarGroupLabel>Suas Conversas</SidebarGroupLabel>
              <SidebarMenu>
                {isLoading ? (
                  <div className="px-2 py-1">
                    <ListSkeleton items={3} showAvatar={false} />
                  </div>
                ) : conversations.length === 0 ? (
                  <SidebarMenuItem>
                    <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                      <p>Nenhuma conversa ainda</p>
                      <p className="text-xs mt-1">Crie uma nova conversa para começar</p>
                    </div>
                  </SidebarMenuItem>
                ) : (
                  conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversationId === conversation.id}
                      onSelect={() => onSelectConversation(conversation)}
                      onRename={() => handleRename(conversation)}
                      onDelete={() => handleDelete(conversation.id)}
                      onPin={() => handlePin(conversation.id)}
                    />
                  ))
                )}
              </SidebarMenu>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>

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

