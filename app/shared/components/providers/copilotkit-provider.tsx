'use client'

import { CopilotKit } from '@copilotkit/react-core'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/shared/core/client'
import type { AppUser } from '@/app/shared/types'

interface CopilotKitProviderProps {
  user: AppUser
  children: React.ReactNode
}

/**
 * CopilotKit Provider Component
 *
 * CopilotKit is the Agentic Application Platform that provides:
 * - UI components (CopilotChat, CopilotPopup, etc.)
 * - Runtime for connecting to LLMs and agent frameworks
 * - State management and streaming
 *
 * This provider wraps children with CopilotKit context, providing:
 * - Runtime URL pointing to /api/copilotkit
 * - Authentication via Bearer token (automatically refreshed)
 * - User properties forwarded to backend actions
 */
export function CopilotKitProvider({ user, children }: CopilotKitProviderProps) {
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

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      headers={{
        Authorization: `Bearer ${accessToken}`,
      }}
      properties={{
        userId: user.id,
        empresaId: user.empresaId ?? null,
        userRole: user.role,
        userName: user.fullName ?? user.email,
      }}
    >
      {children}
    </CopilotKit>
  )
}
