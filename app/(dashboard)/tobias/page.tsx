'use client'

import { useEffect, useState, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
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

export default function TobIAsPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

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

  // Criar transport com headers dinâmicos usando useMemo
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat?stream=true',
      body: {
        sessionId: sessionId || '',
        userId: userId || '',
      },
      prepareSendMessagesRequest: async ({ headers: existingHeaders, body: existingBody, messages, ...options }) => {
        // Obter o token atual do Supabase a cada requisição
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        const headers = new Headers(existingHeaders)
        if (session?.access_token) {
          headers.set('Authorization', `Bearer ${session.access_token}`)
        }
        
        // Obter sessionId e userId dinamicamente (não confiar apenas no estado)
        let currentSessionId = sessionId
        if (!currentSessionId) {
          // Tentar obter do localStorage
          currentSessionId = localStorage.getItem('tobias-session-id')
        }
        if (!currentSessionId) {
          // Gerar um novo se não existir
          currentSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem('tobias-session-id', currentSessionId)
        }
        
        let currentUserId = userId
        if (!currentUserId && session?.user?.id) {
          currentUserId = session.user.id
        }
        
        // Preservar o body original e garantir que messages esteja presente
        // O AI SDK pode adicionar messages automaticamente, mas vamos garantir que esteja aqui
        const mergedBody = {
          ...(existingBody || {}),
          messages: messages || existingBody?.messages || [],
          sessionId: currentSessionId || existingBody?.sessionId || '',
          userId: currentUserId || existingBody?.userId || '',
        }
        
        console.log('[Chat Client] prepareSendMessagesRequest:', {
          messagesCount: messages?.length || 0,
          sessionId: currentSessionId,
          userId: currentUserId,
          bodyKeys: Object.keys(mergedBody),
          hasSessionId: !!mergedBody.sessionId,
          hasUserId: !!mergedBody.userId,
        })
        
        return {
          body: mergedBody,
          headers,
        }
      },
    })
  }, [sessionId, userId])

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onError: (error) => {
      console.error('[Chat Client] Error:', error)
    },
    onResponse: (response) => {
      console.log('[Chat Client] Response received:', response.status, response.statusText)
    },
    onFinish: (message) => {
      console.log('[Chat Client] Message finished:', message.id, message.role)
      console.log('[Chat Client] Message parts:', message.parts?.length || 0)
    },
  })
  
  // Log messages changes
  useEffect(() => {
    console.log('[Chat Client] Messages updated:', messages.length)
    messages.forEach((msg, idx) => {
      console.log(`[Chat Client] Message ${idx}:`, {
        id: msg.id,
        role: msg.role,
        partsCount: msg.parts?.length || 0,
        hasText: msg.parts?.some(p => p.type === 'text') || false,
      })
    })
  }, [messages])

  const isLoading = status === 'streaming' || status === 'submitted'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const message = formData.get('message') as string

    if (!message?.trim() || !sessionId || !userId) {
      return
    }

    sendMessage({
      text: message,
    })

    // Limpar o input
    const textarea = e.currentTarget.querySelector('textarea')
    if (textarea) {
      textarea.value = ''
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

            {messages.map((message) => {
              // Extrair texto das parts
              const textParts = message.parts?.filter((part) => part.type === 'text') || []
              const textContent = textParts.map((part) => (part as { text: string }).text).join('')

              return (
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
                      <div className="whitespace-pre-wrap">{textContent}</div>
                    ) : (
                      <Response>{textContent}</Response>
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
              )
            })}

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
                <p className="text-sm">{error.message}</p>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t bg-background p-4">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              placeholder="Digite sua mensagem..."
              disabled={isLoading || !sessionId || !userId}
            />
            <PromptInputToolbar>
              <PromptInputSubmit
                status={status as 'streaming' | 'submitted' | 'error' | undefined}
                disabled={isLoading || !sessionId || !userId}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}

