'use client'

import { CopilotKit } from '@copilotkit/react-core'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/shared/core/client'
import type { AppUser } from '@/app/shared/types'

type AgentMode = 'copilotkit' | 'mastra';

interface CopilotKitProviderProps {
  user: AppUser
  /** Tenant empresa ID from URL - overrides user.empresaId for multi-org isolation */
  tenantEmpresaId?: string | null
  children: React.ReactNode
  /**
   * Agent mode determines which backend integration to use:
   * - 'copilotkit': Direct-to-LLM with CopilotKit actions (default)
   * - 'mastra': Mastra agent framework via AG-UI protocol
   */
  agentMode?: AgentMode
}

/**
 * CopilotKit Provider Component
 *
 * CopilotKit is the Agentic Application Platform that provides:
 * - UI components (CopilotChat, CopilotPopup, etc.)
 * - Runtime for connecting to LLMs and agent frameworks
 * - State management and streaming
 *
 * Agent Mode:
 * - 'copilotkit': Uses direct LLM calls with backend actions (OpenAIAdapter)
 * - 'mastra': Uses Mastra agents via AG-UI protocol (ExperimentalEmptyAdapter)
 *
 * Both modes use the same /api/copilotkit endpoint, with mode determined by headers.
 */
export function CopilotKitProvider({
  user,
  tenantEmpresaId,
  children,
  agentMode = 'copilotkit',
}: CopilotKitProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Initial token fetch
    const initToken = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        setAccessToken(session.access_token)
      }
      setIsLoading(false)
    }

    initToken()

    // Subscribe to auth state changes to keep token fresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          setAccessToken(session.access_token)
        } else {
          setAccessToken(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Don't render CopilotKit until we have the token
  // This prevents unauthorized requests during initial load
  if (isLoading || !accessToken) {
    return <>{children}</>
  }

  // Build headers - x-tenant-id para backend usar tenant correto
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (tenantEmpresaId) {
    headers['x-tenant-id'] = tenantEmpresaId;
  }
  if (agentMode === 'mastra') {
    headers['X-CopilotKit-Agent'] = 'mastra';
  }

  const effectiveEmpresaId = tenantEmpresaId ?? user.empresaId ?? null;

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      headers={headers}
      properties={{
        userId: user.id,
        empresaId: effectiveEmpresaId,
        userRole: user.role,
        userName: user.fullName ?? user.email,
        agentMode,
      }}
    >
      {children}
    </CopilotKit>
  )
}
