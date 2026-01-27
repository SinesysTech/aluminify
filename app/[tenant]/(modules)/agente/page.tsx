'use client'

import React from 'react'
import { useEffect, useState, useRef, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import { createClient } from '@/app/shared/core/client'
import { useCurrentUser } from '@/components/providers/user-provider'
import { ConversationsPanel } from './components/conversations-panel'
import { CopilotChatSection } from './components/copilot-chat-section'
import { MastraChatSection } from './components/mastra-chat-section'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/app/shared/components/forms/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Paperclip, X, ArrowUp, Loader2, ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/shared/library/utils'
import type { Conversation as ConversationType } from './services/conversation/conversation.types'
import type { AIAgentChatConfig } from '@/app/shared/services/ai-agents'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export default function AgentePage() {
  const user = useCurrentUser()

  // Agent config state
  const [agentConfig, setAgentConfig] = useState<AIAgentChatConfig | null>(null)
  const [agentError, setAgentError] = useState<string | null>(null)

  // Chat state
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentConversation, setCurrentConversation] = useState<ConversationType | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [conversationsPanelOpen, setConversationsPanelOpen] = useState(true)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isNewConversation, setIsNewConversation] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const ATTACHMENT_LIMITS = {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'],
    maxFileSizeMb: 5,
    maxTotalSizeMb: 15,
  }

  // Fetch agent configuration
  useEffect(() => {
    const fetchAgentConfig = async () => {
      if (!user?.empresaId) return

      try {
        const response = await fetch(`/api/ai-agents/${user.empresaId}`)
        if (!response.ok) {
          if (response.status === 404) {
            setAgentError('Nenhum assistente configurado para esta empresa.')
            return
          }
          throw new Error('Erro ao carregar configuração do agente')
        }

        const data = await response.json()
        if (data.success && data.agent) {
          setAgentConfig(data.agent)
        }
      } catch (err) {
        console.error('Error fetching agent config:', err)
        setAgentError('Erro ao carregar assistente. Tente novamente.')
      }
    }

    fetchAgentConfig()
  }, [user?.empresaId])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }, [])

  // Função para carregar conversa
  const loadConversation = useCallback(async (conversation: ConversationType, isNew = false) => {
    if (!accessToken) return

    setMessages([])
    setCurrentConversation(conversation)
    setSelectedConversationId(conversation.id)
    setIsNewConversation(isNew)

    const history = conversation.history && Array.isArray(conversation.history)
      ? conversation.history
      : conversation.messages || []

    if (history.length > 0 && !isNew) {
      setMessages(history)
    } else {
      setMessages([])
    }
  }, [accessToken])

  // Inicializar userId, accessToken e carregar histórico
  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setAccessToken(session.access_token)
      } else {
        setAccessToken(null)
      }
    })

    const initializeChat = async () => {
      try {
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

        if (currentUserId && currentAccessToken) {
          try {
            const response = await fetch('/api/tobias/conversations?active=true', {
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
            console.error('[Agent] Error loading conversation history:', error)
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeChat()

    return () => {
      subscription.unsubscribe()
    }
  }, [loadConversation])

  // Handler para selecionar conversa
  const handleSelectConversation = async (conversation: ConversationType | null) => {
    setMessages([])
    setIsNewConversation(false)

    if (!conversation || !accessToken) {
      setCurrentConversation(null)
      setSelectedConversationId(null)
      setMessages([])
      return
    }

    try {
      const response = await fetch(`/api/tobias/conversations/${conversation.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          const conversationData = data.data
          const hasHistory = conversationData.history && Array.isArray(conversationData.history) && conversationData.history.length > 0
          const createdAt = conversationData.created_at ? new Date(conversationData.created_at).getTime() : 0
          const now = Date.now()
          const isRecentlyCreated = (now - createdAt) < 10000
          const isNew = !hasHistory && isRecentlyCreated

          await loadConversation(conversationData, isNew)
        } else {
          setMessages([])
        }
      }
    } catch (error) {
      console.error('[Agent] Error loading conversation:', error)
      setMessages([])
    }
  }

  const handleConversationUpdated = async () => {
    if (!accessToken || !selectedConversationId) return

    try {
      const response = await fetch(`/api/tobias/conversations/${selectedConversationId}`, {
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
      console.error('[Agent] Error reloading conversation:', error)
    }
  }

  const totalAttachmentsSize = attachments.reduce((acc, file) => acc + file.size, 0)

  const validateAttachments = (files: FileList | File[]) => {
    const accepted: File[] = []

    if (attachments.length >= 1) {
      setError('Envie apenas um arquivo por mensagem. Remova o anexo atual antes de adicionar outro.')
      return []
    }

    for (const file of Array.from(files)) {
      if (!ATTACHMENT_LIMITS.allowedTypes.includes(file.type)) {
        setError('Somente imagens (PNG, JPG, WEBP, GIF) ou PDF são permitidos.')
        continue
      }

      if (file.size > ATTACHMENT_LIMITS.maxFileSizeMb * 1024 * 1024) {
        setError(`Arquivos devem ter no máximo ${ATTACHMENT_LIMITS.maxFileSizeMb}MB.`)
        continue
      }

      accepted.push(file)
    }

    const newTotal = totalAttachmentsSize + accepted.reduce((acc, file) => acc + file.size, 0)
    if (newTotal > ATTACHMENT_LIMITS.maxTotalSizeMb * 1024 * 1024) {
      setError(`Soma dos arquivos deve ter no máximo ${ATTACHMENT_LIMITS.maxTotalSizeMb}MB.`)
      return []
    }

    return accepted
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const validFiles = validateAttachments([files[0]])
    if (validFiles.length > 0) {
      setAttachments((prev) => [...prev, ...validFiles])
      setError(null)
    }
    event.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index))
  }

  const renderUserMessage = (content: string) => {
    const normalizedContent = content.replace(
      /\[Anexo[s]? enviado[s]?: ([^\]]+)\]/g,
      (match, attachmentInfo) => {
        const names = attachmentInfo
          .split(',')
          .map((item: string) => {
            const nameMatch = item.trim().match(/^([^(]+)/)
            return nameMatch ? nameMatch[1].trim() : item.trim()
          })
          .filter(Boolean)
        return `[ANEXO:${names.join(',')}]`
      }
    )

    const attachmentPattern = /\[ANEXO:([^\]]+)\]/g
    const parts: Array<{ type: 'text' | 'attachment'; content: string }> = []
    let lastIndex = 0
    let match

    while ((match = attachmentPattern.exec(normalizedContent)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = normalizedContent.substring(lastIndex, match.index).trim()
        if (textBefore) {
          parts.push({ type: 'text', content: textBefore })
        }
      }

      const attachmentNames = match[1].split(',').map(name => name.trim()).filter(Boolean)
      attachmentNames.forEach(name => {
        parts.push({ type: 'attachment', content: name })
      })

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < normalizedContent.length) {
      const textAfter = normalizedContent.substring(lastIndex).trim()
      if (textAfter) {
        parts.push({ type: 'text', content: textAfter })
      }
    }

    if (parts.length === 0) {
      return <div className="whitespace-pre-wrap">{content}</div>
    }

    return (
      <div className="flex flex-col gap-2">
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <div key={index} className="whitespace-pre-wrap">
                {part.content}
              </div>
            )
          } else {
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md bg-primary/20 px-3 py-2 text-sm"
              >
                <Paperclip className="h-4 w-4 shrink-0" />
                <span className="truncate">{part.content}</span>
              </div>
            )
          }
        })}
      </div>
    )
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || !userId || !accessToken || isLoading) {
      return
    }

    if (!currentConversation) {
      try {
        const response = await fetch('/api/tobias/conversations?active=true', {
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
            if (!accessToken) {
              console.error('[Agent] Cannot create conversation: accessToken is null')
              return
            }

            const createResponse = await fetch('/api/tobias/conversations', {
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
                await loadConversation(createData.conversation, true)
              }
            }
          }
        }
      } catch (error) {
        console.error('[Agent] Error getting/creating conversation:', error)
        return
      }
    }

    const attachmentNote = attachments.length
      ? `\n\n[ANEXO:${attachments.map((file) => file.name).join(',')}]`
      : ''

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: `${text}${attachmentNote}`,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    setTimeout(scrollToBottom, 100)

    try {
      const supabase = createClient()

      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

      if (userError || !authUser) {
        setError('Sessão expirada. Faça login novamente.')
        setIsLoading(false)
        setTimeout(() => {
          window.location.href = '/auth'
        }, 2000)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      if (!authToken) {
        setError('Sessão expirada. Faça login novamente.')
        setIsLoading(false)
        setTimeout(() => {
          window.location.href = '/auth'
        }, 2000)
        return
      }

      const formData = new FormData()
      formData.append('message', text)
      formData.append('userId', userId)
      if (isNewConversation) {
        formData.append('newConversation', 'true')
      }
      attachments.forEach((file) => formData.append('attachments', file))

      const response = await fetch('/api/tobias/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Sessão expirada. Redirecionando para login...')
          setTimeout(() => {
            window.location.href = '/auth'
          }, 2000)
          return
        }

        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: `Erro HTTP ${response.status}: ${response.statusText}` }
        }
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.data.output || data.data.message || 'Sem resposta',
        timestamp: Date.now(),
      }

      if (Array.isArray(data.history)) {
        setMessages(data.history as ChatMessage[])
      } else {
        setMessages(prev => [...prev, assistantMessage])
      }
      setAttachments([])
      setIsNewConversation(false)

      setTimeout(scrollToBottom, 100)

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

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        form.requestSubmit()
      }
    }
  }

  // Show loading state
  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show error if no agent configured
  if (agentError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{agentError}</p>
        </div>
      </div>
    )
  }

  // Show loading while fetching agent config
  if (!agentConfig) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Use CopilotKit integration
  if (agentConfig.integrationType === 'copilotkit') {
    return (
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] flex-col overflow-hidden">
        <div className="mb-2 md:mb-4 flex items-center gap-2 shrink-0">
          <div>
            <h1 className="page-title">{agentConfig.name}</h1>
            <p className="page-subtitle">
              Tire suas dúvidas e receba ajuda personalizada
            </p>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden rounded-lg border">
          <CopilotChatSection className="h-full w-full" />
        </div>
      </div>
    )
  }

  // Use Mastra integration
  if (agentConfig.integrationType === 'mastra') {
    return (
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] flex-col overflow-hidden">
        <div className="mb-2 md:mb-4 flex items-center gap-2 shrink-0">
          <div>
            <h1 className="page-title">{agentConfig.name}</h1>
            <p className="page-subtitle">
              Tire suas dúvidas e receba ajuda personalizada
            </p>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden rounded-lg border">
          <MastraChatSection agentConfig={agentConfig} className="h-full w-full" />
        </div>
      </div>
    )
  }

  // Use n8n/legacy integration (default)
  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] flex-col overflow-hidden">
      <div className="mb-2 md:mb-4 flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setConversationsPanelOpen(!conversationsPanelOpen)}
          className="h-10 w-10 md:h-9 md:w-9"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="sr-only">Toggle conversas</span>
        </Button>
        <div>
          <h1 className="page-title">{agentConfig.name}</h1>
          <p className="page-subtitle">
            Tire suas dúvidas e receba ajuda personalizada
          </p>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden rounded-lg border">
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
        <div className="relative flex flex-1 flex-col min-h-0">
          <ScrollArea
            className="flex-1 p-4"
            ref={scrollAreaRef}
            onScrollCapture={handleScroll}
          >
            <div className="flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="group flex w-full items-end gap-2 py-4 justify-start">
                  <Avatar className="ring-1 ring-border size-10 mr-2">
                    <AvatarImage alt={agentConfig.name} src={agentConfig.avatarUrl || undefined} />
                    <AvatarFallback>{agentConfig.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-foreground text-sm bg-secondary max-w-[80%]">
                    <div className="whitespace-pre-wrap">
                      {agentConfig.greetingMessage || `Olá! Eu sou o ${agentConfig.name}. Como posso ajudá-lo hoje?`}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'group flex w-full items-end gap-2 py-2',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="ring-1 ring-border size-10 mr-2">
                      <AvatarImage alt={agentConfig.name} src={agentConfig.avatarUrl || undefined} />
                      <AvatarFallback>{agentConfig.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-sm max-w-[80%]',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    )}
                  >
                    {message.role === 'user' ? (
                      renderUserMessage(message.content)
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="ring-1 ring-border size-8 ml-2">
                      <AvatarImage alt="Você" src="" />
                      <AvatarFallback>VO</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="group flex w-full items-end gap-2 py-2 justify-start">
                  <Avatar className="ring-1 ring-border size-10 mr-2">
                    <AvatarImage alt={agentConfig.name} src={agentConfig.avatarUrl || undefined} />
                    <AvatarFallback>{agentConfig.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-foreground text-sm bg-secondary">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-4">
                  <p className="font-medium">Erro ao enviar mensagem</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {showScrollButton && (
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-24 right-4 rounded-full shadow-md"
              onClick={scrollToBottom}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}

          <div className="bg-background p-2 md:p-4 sticky bottom-0">
            <div className="space-y-2">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-md border border-dashed border-muted-foreground/40 p-2 text-xs">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 rounded bg-muted px-2 py-1.5"
                    >
                      <span className="truncate max-w-[120px] md:max-w-[150px] text-xs">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-muted-foreground hover:text-foreground h-5 w-5 flex items-center justify-center"
                        aria-label="Remover anexo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm"
              >
                <Textarea
                  ref={inputRef}
                  name="message"
                  placeholder={agentConfig.placeholderText || 'Digite sua mensagem...'}
                  disabled={isLoading || !userId}
                  onKeyDown={handleKeyDown}
                  className="w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0 field-sizing-content max-h-[6lh] bg-transparent dark:bg-transparent focus-visible:ring-0 min-h-11 text-sm md:text-base"
                />
                <div className="flex items-center justify-between p-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {agentConfig.supportsAttachments && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isLoading || !userId}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 w-10 md:h-9 md:w-9"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span className="sr-only">Adicionar anexos</span>
                    </Button>
                  )}
                  {!agentConfig.supportsAttachments && <div />}
                  <Button
                    type="submit"
                    disabled={isLoading || !userId}
                    className="h-8 w-8 gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 p-0"
                    size="icon"
                  >
                    {isLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ArrowUp className="size-3.5" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
