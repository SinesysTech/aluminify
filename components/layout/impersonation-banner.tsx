"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useCurrentUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/client"

export function ImpersonationBanner() {
  const user = useCurrentUser()
  const router = useRouter()
  const [isStopping, setIsStopping] = useState(false)

  // Verificar se está em modo impersonação
  const isImpersonating = user && '_impersonationContext' in user && user._impersonationContext

  if (!isImpersonating) {
    return null
  }

  const handleStopImpersonation = async () => {
    setIsStopping(true)
    try {
      // Obter token de autenticação
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('Erro ao obter sessão:', sessionError)
        alert('Sessão expirada. Faça login novamente.')
        return
      }

      const response = await fetch('/api/auth/stop-impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json().catch(() => ({ error: 'Erro desconhecido' }))

      if (response.ok) {
        router.push(data.redirectTo || '/professor/dashboard')
        router.refresh()
      } else {
        console.error('Erro ao parar impersonação:', {
          status: response.status,
          statusText: response.statusText,
          error: data,
        })
        alert(data.error || `Erro ao parar impersonação (${response.status})`)
      }
    } catch (error) {
      console.error('Erro ao parar impersonação:', error)
      alert('Erro ao parar impersonação. Verifique o console para mais detalhes.')
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <div className="container mx-auto max-w-full px-2 md:px-4">
      <Alert
        variant="default"
        className="max-w-full border-2 border-status-success bg-status-success px-3 py-2 text-xs text-status-success-foreground md:px-4 md:py-2.5"
      >
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="leading-tight">
          Modo Visualização Ativo
        </AlertTitle>
        <AlertDescription className="flex w-full flex-col gap-2 text-status-success-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="min-w-0 text-center leading-snug sm:text-left">
            Você está visualizando como{" "}
            <strong className="font-semibold wrap-break-word">{user.fullName || user.email}</strong>. Esta
            é uma visualização somente leitura.
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={handleStopImpersonation}
            disabled={isStopping}
            className="h-8 w-full shrink-0 bg-status-success-foreground px-3 text-xs text-status-success-text hover:bg-status-success-foreground/90 sm:w-auto"
          >
            <X className="mr-2 h-3.5 w-3.5" />
            {isStopping ? 'Voltando...' : 'Voltar para visualização do professor'}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}



