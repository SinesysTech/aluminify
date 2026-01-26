"use client"

import {
  Settings,
  Shield,
  Bell,
  Gauge,
  Sparkles,
  Wrench,
} from "lucide-react"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import { ConfigCard } from "./config-card"
import type { SystemConfig, ConfigCategory } from "../types"

interface ConfigSectionProps {
  category: ConfigCategory
  configs: SystemConfig[]
  isLoading: boolean
  onConfigUpdate: (config: SystemConfig) => void
}

const categoryIcons: Record<ConfigCategory, typeof Settings> = {
  general: Settings,
  security: Shield,
  notifications: Bell,
  limits: Gauge,
  features: Sparkles,
  maintenance: Wrench,
}

const categoryLabels: Record<ConfigCategory, { title: string; description: string }> = {
  general: {
    title: "Configurações Gerais",
    description: "Configurações básicas do sistema",
  },
  security: {
    title: "Segurança",
    description: "Configurações de autenticação e segurança",
  },
  notifications: {
    title: "Notificações",
    description: "Configurações de e-mail e alertas",
  },
  limits: {
    title: "Limites",
    description: "Limites de recursos e quotas",
  },
  features: {
    title: "Funcionalidades",
    description: "Ativar ou desativar recursos do sistema",
  },
  maintenance: {
    title: "Manutenção",
    description: "Modo de manutenção e backups",
  },
}

export function ConfigSection({
  category,
  configs,
  isLoading,
  onConfigUpdate,
}: ConfigSectionProps) {
  const Icon = categoryIcons[category] || Settings
  const labels = categoryLabels[category]

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-medium">{labels.title}</h3>
          <p className="text-sm text-muted-foreground">{labels.description}</p>
        </div>
      </div>

      {configs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma configuração nesta categoria
        </p>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <ConfigCard
              key={config.key}
              config={config}
              onUpdate={onConfigUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
