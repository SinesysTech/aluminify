'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import type { ChangeEvent } from 'react'
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
import { MessageSquare, Paperclip, X } from 'lucide-react'
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
  const [attachments, setAttachments] = useState<File[]>([])
  const [isNewConversation, setIsNewConversation] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ATTACHMENT_LIMITS = {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'],
    maxFileSizeMb: 5,
    maxTotalSizeMb: 15,
  }

  // Função para carregar conversa
  const loadConversation = useCallback(async (conversation: ConversationType, isNew = false) => {
    if (!accessToken) return

    // Limpar mensagens primeiro para evitar mostrar mensagens da conversa anterior
    setMessages([])

    setCurrentConversation(conversation)
    setSelectedConversationId(conversation.id)
    setIsNewConversation(isNew)

    const history = conversation.history && Array.isArray(conversation.history)
      ? conversation.history
      : conversation.messages || []

    if (history.length > 0 && !isNew) {
      console.log('[TobIAs] Loaded', history.length, 'messages from conversation')
      setMessages(history)
    } else {
      // Garantir que mensagens estejam vazias para nova conversa
      setMessages([])
    }
  }, [accessToken])

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
  }, [loadConversation])

  // Handler para selecionar conversa
  const handleSelectConversation = async (conversation: ConversationType | null) => {
    // Limpar mensagens imediatamente ao trocar de conversa
    setMessages([])
    setIsNewConversation(false)

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
          // Verificar se é uma conversa nova (sem histórico e criada recentemente)
          const conversationData = data.data
          const hasHistory = conversationData.history && Array.isArray(conversationData.history) && conversationData.history.length > 0
          const createdAt = conversationData.created_at ? new Date(conversationData.created_at).getTime() : 0
          const now = Date.now()
          const isRecentlyCreated = (now - createdAt) < 10000 // Criada nos últimos 10 segundos
          const isNew = !hasHistory && isRecentlyCreated

          await loadConversation(conversationData, isNew)
        } else {
          // Se não houver dados, garantir que mensagens estejam vazias
          setMessages([])
        }
      }
    } catch (error) {
      console.error('[TobIAs] Error loading conversation:', error)
      // Em caso de erro, garantir que mensagens estejam vazias
      setMessages([])
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

  // Função para processar mensagens com anexos e renderizar de forma limpa
  const renderUserMessage = (content: string) => {
    // Primeiro, normalizar formato antigo para o novo formato
    // Formato antigo: [Anexo enviado: nome (url)] ou [Anexos enviados: nome1, nome2]
    const normalizedContent = content.replace(
      /\[Anexo[s]? enviado[s]?: ([^\]]+)\]/g,
      (match, attachmentInfo) => {
        // Extrair apenas os nomes dos arquivos (remover URLs entre parênteses)
        const names = attachmentInfo
          .split(',')
          .map((item: string) => {
            // Se contém parênteses, extrair apenas o nome antes do parêntese
            const nameMatch = item.trim().match(/^([^(]+)/)
            return nameMatch ? nameMatch[1].trim() : item.trim()
          })
          .filter(Boolean)
        return `[ANEXO:${names.join(',')}]`
      }
    )

    // Padrão: [ANEXO:nome1,nome2,...]
    const attachmentPattern = /\[ANEXO:([^\]]+)\]/g
    const parts: Array<{ type: 'text' | 'attachment'; content: string }> = []
    let lastIndex = 0
    let match

    while ((match = attachmentPattern.exec(normalizedContent)) !== null) {
      // Adicionar texto antes do anexo
      if (match.index > lastIndex) {
        const textBefore = normalizedContent.substring(lastIndex, match.index).trim()
        if (textBefore) {
          parts.push({ type: 'text', content: textBefore })
        }
      }

      // Adicionar anexos
      const attachmentNames = match[1].split(',').map(name => name.trim()).filter(Boolean)
      attachmentNames.forEach(name => {
        parts.push({ type: 'attachment', content: name })
      })

      lastIndex = match.index + match[0].length
    }

    // Adicionar texto restante
    if (lastIndex < normalizedContent.length) {
      const textAfter = normalizedContent.substring(lastIndex).trim()
      if (textAfter) {
        parts.push({ type: 'text', content: textAfter })
      }
    }

    // Se não encontrou padrão de anexo, retorna o conteúdo original
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
                await loadConversation(createData.conversation, true)
              }
            }
          }
        }
      } catch (error) {
        console.error('[TobIAs] Error getting/creating conversation:', error)
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

    // Adicionar mensagem do usuário imediatamente
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      if (!authToken) {
        setError('Sessão expirada. Faça login novamente.')
        setIsLoading(false)
        return
      }

      const formData = new FormData()
      formData.append('message', text)
      formData.append('userId', userId)
      // Enviar newConversation=true se for uma nova conversa (primeira mensagem)
      if (isNewConversation) {
        formData.append('newConversation', 'true')
      }
      attachments.forEach((file) => formData.append('attachments', file))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
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

      if (Array.isArray(data.history)) {
        setMessages(data.history as ChatMessage[])
      } else {
        setMessages(prev => [...prev, assistantMessage])
      }
      setAttachments([])
      // Após enviar a primeira mensagem, marcar que não é mais uma nova conversa
      setIsNewConversation(false)

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
          <h1 className="text-xl md:text-2xl font-bold">TobIAs</h1>
          <p className="text-muted-foreground text-xs md:text-sm">
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

        {/* Área do chat - full width em mobile quando painel fechado */}
        <div className="relative flex flex-1 flex-col min-h-0">
          <Conversation>
            <ConversationContent>
              {messages.length === 0 && (
                <Message from="assistant">
                  <MessageAvatar
                    src="/tobiasavatar.png"
                    name="TobIAs"
                    className="mr-2"
                  />
                  <MessageContent>
                    <Response>
                      {`Olá! Eu sou @ TobIAs, responsável pela monitoria do curso CDF.\n\nComo posso ajudá-lo hoje?`}
                    </Response>
                  </MessageContent>
                </Message>
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
                      renderUserMessage(message.content)
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

              <PromptInput onSubmit={handleSubmit}>
                <PromptInputTextarea
                  ref={inputRef}
                  placeholder="Digite sua mensagem..."
                  disabled={isLoading || !userId}
                  className="min-h-11 text-sm md:text-base"
                />
                <PromptInputToolbar>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
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
                  <PromptInputSubmit
                    disabled={isLoading || !userId}
                    className="h-8 w-8"
                  />
                </PromptInputToolbar>
              </PromptInput>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
