"use client"

import { useState } from "react"
import { Save, Loader2 } from "lucide-react"
import { Input } from "@/app/shared/components/forms/input"
import { Switch } from "@/app/shared/components/forms/switch"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/app/shared/core/client"
import type { SystemConfig } from "../types"

interface ConfigCardProps {
  config: SystemConfig
  onUpdate: (config: SystemConfig) => void
}

export function ConfigCard({ config, onUpdate }: ConfigCardProps) {
  const [value, setValue] = useState(config.value)
  const [isSaving, setIsSaving] = useState(false)
  const hasChanges = value !== config.value

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          variant: "destructive",
          title: "Sessão expirada",
          description: "Faça login novamente.",
        })
        return
      }

      const response = await fetch("/api/superadmin/configuracoes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          key: config.key,
          value: config.type === "number" ? Number(value) : value,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao salvar configuração")
      }

      const result = await response.json()

      toast({
        title: "Configuração salva",
        description: result.message,
      })

      onUpdate(result.data)
    } catch (error) {
      console.error("Error saving config:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao salvar configuração",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <code className="text-sm font-medium">{config.key}</code>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {config.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {config.type === "boolean" ? (
            <Switch
              checked={value as boolean}
              onCheckedChange={(checked) => setValue(checked)}
            />
          ) : config.type === "number" ? (
            <Input
              type="number"
              value={value as number}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-32"
            />
          ) : (
            <Input
              type="text"
              value={value as string}
              onChange={(e) => setValue(e.target.value)}
              className="w-64"
            />
          )}

          {config.type !== "boolean" && hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Salvar
            </Button>
          )}
        </div>
      </div>

      {config.type === "boolean" && hasChanges && (
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1"
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Salvar
          </Button>
        </div>
      )}
    </div>
  )
}
