'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useCurrentUser } from '@/components/providers/user-provider'
import { N8nChatSection } from '@/app/tobias/components/n8n-chat-section'
import { Loader2, AlertCircle } from 'lucide-react'
import type { AIAgentChatConfig } from '@/app/shared/services/ai-agents'

export default function AgentePage() {
  const user = useCurrentUser()

  // Agent config state
  const [agentConfig, setAgentConfig] = useState<AIAgentChatConfig | null>(null)
  const [agentError, setAgentError] = useState<string | null>(null)

  // Fetch agent configuration
  useEffect(() => {
    const fetchAgentConfig = async () => {
      if (!user?.empresaId) return

      try {
        const response = await fetch(`/api/ai-agents/${user.empresaId}?config=chat`)
        if (!response.ok) {
          if (response.status === 404) {
            setAgentError('Nenhum assistente configurado para esta empresa.')
            return
          }
          throw new Error('Erro ao carregar configuração do agente')
        }

        const data = await response.json()
        if (data.success && data.data) {
          setAgentConfig(data.data)
        }
      } catch (err) {
        console.error('Error fetching agent config:', err)
        setAgentError('Erro ao carregar assistente. Tente novamente.')
      }
    }

    fetchAgentConfig()
  }, [user?.empresaId])

  // Show error if no agent configured
  if (agentError) {
    return (
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
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
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // N8N integration (TobIAs)
  return <N8nChatSection agentConfig={agentConfig} />
}
