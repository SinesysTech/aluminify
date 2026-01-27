"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { createClient } from "@/app/shared/core/client"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfigSection } from "./config-section"
import type { SystemConfig, ConfigCategory } from "../types"

interface ConfigData {
  configs: SystemConfig[]
  groupedConfigs: Record<string, SystemConfig[]>
}

const categories: ConfigCategory[] = [
  "general",
  "security",
  "notifications",
  "limits",
  "features",
  "maintenance",
]

const categoryLabels: Record<ConfigCategory, string> = {
  general: "Geral",
  security: "Segurança",
  notifications: "Notificações",
  limits: "Limites",
  features: "Funcionalidades",
  maintenance: "Manutenção",
}

export function ConfiguracoesContent() {
  const [data, setData] = useState<ConfigData | null>(null)
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

      const response = await fetch("/api/superadmin/configuracoes", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Erro ao carregar configurações")
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error("Error fetching configuracoes:", err)
      setError(
        err instanceof Error ? err.message : "Erro ao carregar configurações"
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleConfigUpdate = (updatedConfig: SystemConfig) => {
    if (!data) return

    // Update in configs array
    const newConfigs = data.configs.map((c) =>
      c.key === updatedConfig.key ? updatedConfig : c
    )

    // Update in grouped configs
    const newGroupedConfigs = { ...data.groupedConfigs }
    if (newGroupedConfigs[updatedConfig.category]) {
      newGroupedConfigs[updatedConfig.category] = newGroupedConfigs[
        updatedConfig.category
      ].map((c) => (c.key === updatedConfig.key ? updatedConfig : c))
    }

    setData({
      configs: newConfigs,
      groupedConfigs: newGroupedConfigs,
    })
  }

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

      {/* Config Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {categoryLabels[category]}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <ConfigSection
              category={category}
              configs={data?.groupedConfigs[category] || []}
              isLoading={isLoading}
              onConfigUpdate={handleConfigUpdate}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
