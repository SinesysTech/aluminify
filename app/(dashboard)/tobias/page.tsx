'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/client'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ui/shadcn-io/ai/conversation'
import { Message, MessageContent, MessageAvatar } from '@/components/ui/shadcn-io/ai/message'
import { Response } from '@/components/ui/shadcn-io/ai/response'
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from '@/components/ui/shadcn-io/ai/prompt-input'
import { Loader } from '@/components/ui/shadcn-io/ai/loader'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export default function TobIAsPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Inicializar sessionId, userId e accessToken
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Gerar ou recuperar sessionId do localStorage
        let storedSessionId = localStorage.getItem('tobias-session-id')
        if (!storedSessionId) {
          storedSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem('tobias-session-id', storedSessionId)
        }
        setSessionId(storedSessionId)

        // Obter userId e accessToken do usuário autenticado
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          setUserId(session.user.id)
        }
        if (session?.access_token) {
          setAccessToken(session.access_token)
        }

        // Configurar listener para atualizar o token quando a sessão mudar
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.access_token) {
            setAccessToken(session.access_token)
          } else {
            setAccessToken(null)
          }
        })
      } catch (error) {
        console.error('Error initializing chat:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeChat()
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim() || !sessionId || !userId || isLoading) {
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    // Adicionar mensagem do usuário imediatamente
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          message: text,
          sessionId,
          userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }

      const data = await response.json()

      // Adicionar resposta do assistente
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.data.output || data.data.message || 'Sem resposta',
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const message = formData.get('message') as string

    if (!message?.trim()) {
      return
    }

    await sendMessage(message)

    // Limpar o input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">TobIAs</h1>
        <p className="text-muted-foreground text-sm">
          Sua monitora de curso. Tire suas dúvidas e receba ajuda personalizada.
        </p>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden rounded-lg border">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2 text-lg">
                    Olá! Eu sou a TobIAs, sua monitora de curso.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Como posso ajudá-lo hoje?
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                {message.role === 'assistant' && (
                  <MessageAvatar
                    src=""
                    name="TobIAs"
                    className="mr-2"
                  />
                )}
                <MessageContent>
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <Response>{message.content}</Response>
                  )}
                </MessageContent>
                {message.role === 'user' && (
                  <MessageAvatar
                    src=""
                    name="Você"
                    className="ml-2"
                  />
                )}
              </Message>
            ))}

            {isLoading && (
              <Message from="assistant">
                <MessageAvatar
                  src=""
                  name="TobIAs"
                  className="mr-2"
                />
                <MessageContent>
                  <Loader />
                </MessageContent>
              </Message>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-4">
                <p className="font-medium">Erro ao enviar mensagem</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t bg-background p-4">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              ref={inputRef}
              placeholder="Digite sua mensagem..."
              disabled={isLoading || !sessionId || !userId}
            />
            <PromptInputToolbar>
              <PromptInputSubmit
                disabled={isLoading || !sessionId || !userId}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}
