'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/app/shared/core/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/app/shared/components/forms/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowUp, Loader2, ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/shared/library/utils'
import type { AIAgentChatConfig, MastraIntegrationConfig } from '@/app/shared/services/ai-agents'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface MastraChatSectionProps {
  agentConfig: AIAgentChatConfig
  className?: string
}

export function MastraChatSection({ agentConfig, className }: MastraChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const integrationConfig = agentConfig.integrationConfig as MastraIntegrationConfig
  const useStreaming = integrationConfig?.streaming_enabled !== false

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }, [])

  // Auto-scroll when streaming
  useEffect(() => {
    if (streamingContent) {
      scrollToBottom()
    }
  }, [streamingContent, scrollToBottom])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    setStreamingContent('')

    setTimeout(scrollToBottom, 100)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        setError('Sessão expirada. Faça login novamente.')
        setIsLoading(false)
        return
      }

      const allMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
      ]

      if (useStreaming) {
        // Streaming request
        const response = await fetch('/api/mastra/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            agentSlug: agentConfig.slug,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Erro HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('Streaming não suportado')
        }

        const decoder = new TextDecoder()
        let accumulatedContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type === 'text') {
                  accumulatedContent += data.content
                  setStreamingContent(accumulatedContent)
                } else if (data.type === 'error') {
                  throw new Error(data.message)
                }
              } catch {
                // Ignore JSON parse errors for partial chunks
              }
            }
          }
        }

        // Add the completed message
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: accumulatedContent || 'Sem resposta',
          timestamp: Date.now(),
        }

        setMessages(prev => [...prev, assistantMessage])
        setStreamingContent('')
      } else {
        // Non-streaming request
        const response = await fetch('/api/mastra', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            agentSlug: agentConfig.slug,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Erro HTTP ${response.status}`)
        }

        const data = await response.json()

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message || 'Sem resposta',
          timestamp: Date.now(),
        }

        setMessages(prev => [...prev, assistantMessage])
      }

      setTimeout(scrollToBottom, 100)
    } catch (err) {
      console.error('[Mastra Chat] Error:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setStreamingContent('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const message = formData.get('message') as string

    if (!message?.trim()) return

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

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages area */}
      <div className="relative flex flex-1 flex-col min-h-0">
        <ScrollArea
          className="flex-1 p-4"
          ref={scrollAreaRef}
          onScrollCapture={handleScroll}
        >
          <div className="flex flex-col gap-4">
            {/* Initial greeting */}
            {messages.length === 0 && !streamingContent && (
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

            {/* Chat messages */}
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
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.role === 'user' && (
                  <Avatar className="ring-1 ring-border size-8 ml-2">
                    <AvatarImage alt="Você" src="" />
                    <AvatarFallback>VO</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Streaming message */}
            {streamingContent && (
              <div className="group flex w-full items-end gap-2 py-2 justify-start">
                <Avatar className="ring-1 ring-border size-10 mr-2">
                  <AvatarImage alt={agentConfig.name} src={agentConfig.avatarUrl || undefined} />
                  <AvatarFallback>{agentConfig.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-foreground text-sm bg-secondary max-w-[80%]">
                  <div className="whitespace-pre-wrap">{streamingContent}</div>
                </div>
              </div>
            )}

            {/* Loading indicator (non-streaming) */}
            {isLoading && !useStreaming && !streamingContent && (
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

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg p-4">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Erro ao enviar mensagem</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Scroll to bottom button */}
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

        {/* Input area */}
        <div className="bg-background p-2 md:p-4 sticky bottom-0">
          <form
            onSubmit={handleSubmit}
            className="w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm"
          >
            <Textarea
              ref={inputRef}
              name="message"
              placeholder={agentConfig.placeholderText || 'Digite sua mensagem...'}
              disabled={isLoading}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0 field-sizing-content max-h-[6lh] bg-transparent dark:bg-transparent focus-visible:ring-0 min-h-11 text-sm md:text-base"
            />
            <div className="flex items-center justify-end p-1">
              <Button
                type="submit"
                disabled={isLoading}
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
  )
}
