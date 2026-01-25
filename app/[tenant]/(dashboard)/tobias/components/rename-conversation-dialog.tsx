'use client'

import React from 'react'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Conversation } from '@/backend/services/conversation/conversation.types'

interface RenameConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversation: Conversation | null
  accessToken: string | null
  onRenameComplete: () => void
}

export function RenameConversationDialog({
  open,
  onOpenChange,
  conversation,
  accessToken,
  onRenameComplete,
}: RenameConversationDialogProps) {
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (conversation) {
      setTitle(conversation.title)
    }
  }, [conversation])

  const handleSave = async () => {
    if (!conversation || !accessToken) return
    
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      alert('O nome da conversa não pode estar vazio')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: trimmedTitle,
        }),
      })

      if (response.ok) {
        onRenameComplete()
      } else {
        let errorMessage = 'Erro ao renomear conversa'
        try {
          const contentType = response.headers.get('content-type') || ''
          const responseText = await response.text()
          
          if (responseText) {
            if (contentType.includes('application/json')) {
              try {
                const errorData = JSON.parse(responseText)
                errorMessage = errorData.error || errorData.message || errorMessage
              } catch {
                // Se não for JSON válido, usar o texto como mensagem
                errorMessage = responseText || errorMessage
              }
            } else {
              errorMessage = responseText || errorMessage
            }
          }
        } catch (parseError) {
          console.error('[RenameConversationDialog] Error parsing error response:', parseError)
        }
        console.error('[RenameConversationDialog] Error:', response.status, errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error('[RenameConversationDialog] Error:', error)
      alert('Erro ao renomear conversa')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear Conversa</DialogTitle>
          <DialogDescription>
            Digite um novo nome para esta conversa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nome da conversa</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nome da conversa"
              disabled={isSaving}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

