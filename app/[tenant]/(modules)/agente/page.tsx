'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useCurrentUser } from '@/components/providers/user-provider'
import { CopilotChatSection } from './components/copilot-chat-section'
import { MastraChatSection } from './components/mastra-chat-section'
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

  // TOBIAS-LEGACY: N8N/legacy integration (TobIAs para CDF)
  // Remover este bloco quando TobIAs for deletado — basta remover o import e este return
  return <N8nChatSection agentConfig={agentConfig} />
}
