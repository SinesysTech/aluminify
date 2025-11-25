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
import { ConversationsPanel } from '@/components/conversations-panel'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import type { Conversation as ConversationType } from '@/backend/services/conversation/conversation.types'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export default function TobIAsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentConversation, setCurrentConversation] = useState<ConversationType | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [conversationsPanelOpen, setConversationsPanelOpen] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Função para carregar conversa
  const loadConversation = async (conversation: ConversationType) => {
    if (!accessToken) return

    setCurrentConversation(conversation)
    setSelectedConversationId(conversation.id)

    // Carregar mensagens da conversa
    if (conversation.messages && conversation.messages.length > 0) {
      console.log('[TobIAs] Loaded', conversation.messages.length, 'messages from conversation')
      setMessages(conversation.messages)
    } else {
      setMessages([])
    }
  }

  // Inicializar userId, accessToken e carregar histórico
  useEffect(() => {
    const supabase = createClient()
    
    // Configurar listener para atualizar o token quando a sessão mudar
    // Criar a subscription de forma síncrona para garantir que o cleanup funcione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setAccessToken(session.access_token)
      } else {
        setAccessToken(null)
      }
    })

    const initializeChat = async () => {
      try {
        // Obter userId e accessToken do usuário autenticado
        const { data: { session } } = await supabase.auth.getSession()

        let currentUserId: string | null = null
        let currentAccessToken: string | null = null

        if (session?.user?.id) {
          currentUserId = session.user.id
          setUserId(currentUserId)
        }
        if (session?.access_token) {
          currentAccessToken = session.access_token
          setAccessToken(currentAccessToken)
        }

        // Carregar histórico da conversa ativa
        if (currentUserId && currentAccessToken) {
          try {
            const response = await fetch('/api/conversations?active=true', {
              headers: {
                'Authorization': `Bearer ${currentAccessToken}`,
              },
            })

            if (response.ok) {
              const data = await response.json()
              const activeConversation = data.conversations?.[0]

              if (activeConversation) {
                await loadConversation(activeConversation)
              }
            }
          } catch (error) {
            console.error('[TobIAs] Error loading conversation history:', error)
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeChat()

    // Retornar função de cleanup para desinscrever o listener quando o componente desmontar
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Handler para selecionar conversa
  const handleSelectConversation = async (conversation: ConversationType | null) => {
    if (!conversation || !accessToken) {
      setCurrentConversation(null)
      setSelectedConversationId(null)
      setMessages([])
      return
    }

    try {
      // Buscar conversa completa por ID
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          await loadConversation(data.data)
        }
      }
    } catch (error) {
      console.error('[TobIAs] Error loading conversation:', error)
    }
  }

  // Handler para quando conversas são atualizadas
  const handleConversationUpdated = async () => {
    if (!accessToken || !selectedConversationId) return

    try {
      // Recarregar conversa atual
      const response = await fetch(`/api/conversations/${selectedConversationId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          await loadConversation(data.data)
        }
      }
    } catch (error) {
      console.error('[TobIAs] Error reloading conversation:', error)
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || !userId || !accessToken || isLoading) {
      return
    }

    // Se não há conversa selecionada, criar ou obter uma ativa
    if (!currentConversation) {
      try {
        const response = await fetch('/api/conversations?active=true', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const activeConversation = data.conversations?.[0]
          
          if (activeConversation) {
            await loadConversation(activeConversation)
          } else {
            // Criar nova conversa se não houver nenhuma ativa
            if (!accessToken) {
              console.error('[TobIAs] Cannot create conversation: accessToken is null')
              return
            }
            
            const createResponse = await fetch('/api/conversations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                title: 'Nova Conversa',
              }),
            })

            if (createResponse.ok) {
              const createData = await createResponse.json()
              if (createData.conversation) {
                await loadConversation(createData.conversation)
              }
            }
          }
        }
      } catch (error) {
        console.error('[TobIAs] Error getting/creating conversation:', error)
        return
      }
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

      // Recarregar conversa para ter os dados atualizados
      if (currentConversation) {
        await handleConversationUpdated()
      }
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
      <div className="mb-2 md:mb-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setConversationsPanelOpen(!conversationsPanelOpen)}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="sr-only">Toggle conversas</span>
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">TobIAs</h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Sua monitora de curso. Tire suas dúvidas e receba ajuda personalizada.
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-2 md:gap-4 overflow-hidden">
        {/* Painel de conversas */}
        <ConversationsPanel
          selectedConversationId={selectedConversationId}
          onSelectConversation={(conv) => {
            handleSelectConversation(conv)
          }}
          onConversationUpdated={handleConversationUpdated}
          accessToken={accessToken}
          open={conversationsPanelOpen}
          onOpenChange={setConversationsPanelOpen}
        />

        {/* Área do chat */}
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
                      src="/tobiasavatar.png"
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

          <div className="border-t bg-background p-2 md:p-4">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                ref={inputRef}
                placeholder="Digite sua mensagem..."
                disabled={isLoading || !userId}
              />
              <PromptInputToolbar>
                <PromptInputSubmit
                  disabled={isLoading || !userId}
                />
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  )
}
