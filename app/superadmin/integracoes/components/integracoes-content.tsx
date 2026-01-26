"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { createClient } from "@/app/shared/core/client"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IntegrationStatsCards } from "./integration-stats"
import { ProvidersOverview } from "./providers-overview"
import { EmpresasIntegrations } from "./empresas-integrations"
import { ApiKeysList } from "./api-keys-list"
import type {
  IntegrationStats,
  EmpresaIntegration,
  ApiKeyInfo,
} from "../types"

interface IntegracoesData {
  stats: IntegrationStats
  empresasIntegrations: EmpresaIntegration[]
  apiKeys: ApiKeyInfo[]
}

export function IntegracoesContent() {
  const [data, setData] = useState<IntegracoesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError("Sessão expirada. Faça login novamente.")
        return
      }

      const response = await fetch("/api/superadmin/integracoes", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Erro ao carregar integrações")
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error("Error fetching integracoes:", err)
      setError(
        err instanceof Error ? err.message : "Erro ao carregar integrações"
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => fetchData()}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <IntegrationStatsCards stats={data?.stats || null} isLoading={isLoading} />

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="empresas">Por Empresa</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProvidersOverview stats={data?.stats || null} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="empresas">
          <EmpresasIntegrations
            data={data?.empresasIntegrations || []}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="apikeys">
          <ApiKeysList apiKeys={data?.apiKeys || []} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
