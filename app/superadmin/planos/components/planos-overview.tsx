"use client"

import { Check, X, Star, Users, Building2, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { PlanoConfig, PlanoStats } from "../types"
import { formatPlanPrice } from "../config"

interface PlanosOverviewProps {
  planos: PlanoConfig[]
  stats: PlanoStats[]
  isLoading: boolean
}

export function PlanosOverview({
  planos,
  stats,
  isLoading,
}: PlanosOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-24 mb-2" />
            <Skeleton className="h-4 w-full mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {planos.map((plano) => {
        const planoStats = stats.find((s) => s.planoId === plano.id)

        return (
          <div
            key={plano.id}
            className={`rounded-xl border bg-card p-6 relative ${
              plano.recommended ? "ring-2 ring-primary" : ""
            }`}
          >
            {plano.recommended && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1">
                <Star className="h-3 w-3" />
                Recomendado
              </Badge>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-semibold">{plano.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {plano.description}
              </p>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold">
                {formatPlanPrice(plano.priceCents)}
              </span>
              <span className="text-muted-foreground">
                /{plano.priceInterval === "month" ? "mês" : "ano"}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                </div>
                <div className="text-lg font-semibold">
                  {planoStats?.totalEmpresas || 0}
                </div>
                <div className="text-xs text-muted-foreground">Empresas</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                </div>
                <div className="text-lg font-semibold">
                  {planoStats?.totalUsuarios || 0}
                </div>
                <div className="text-xs text-muted-foreground">Usuários</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                </div>
                <div className="text-lg font-semibold">
                  {formatPlanPrice(planoStats?.totalRevenue || 0)}
                </div>
                <div className="text-xs text-muted-foreground">30d</div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {plano.features.map((feature) => (
                <div key={feature.id} className="flex items-start gap-2">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span
                      className={
                        feature.included ? "" : "text-muted-foreground"
                      }
                    >
                      {feature.name}
                    </span>
                    {feature.limit && feature.included && (
                      <span className="text-muted-foreground text-sm ml-1">
                        ({feature.limit === "unlimited" ? "ilimitado" : `até ${feature.limit}`})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Limits */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Limites</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Professores:</div>
                <div className="text-right">
                  {plano.limits.maxProfessores === null
                    ? "Ilimitado"
                    : plano.limits.maxProfessores}
                </div>
                <div className="text-muted-foreground">Alunos:</div>
                <div className="text-right">
                  {plano.limits.maxAlunos === null
                    ? "Ilimitado"
                    : plano.limits.maxAlunos}
                </div>
                <div className="text-muted-foreground">Cursos:</div>
                <div className="text-right">
                  {plano.limits.maxCursos === null
                    ? "Ilimitado"
                    : plano.limits.maxCursos}
                </div>
                <div className="text-muted-foreground">Armazenamento:</div>
                <div className="text-right">
                  {plano.limits.maxStorage
                    ? `${Math.round(plano.limits.maxStorage / 1024)}GB`
                    : "Ilimitado"}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
