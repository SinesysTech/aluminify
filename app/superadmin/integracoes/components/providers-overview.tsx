"use client"

import {
  Calendar,
  Video,
  CreditCard,
  HardDrive,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"

import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { IntegrationStats } from "../types"

interface ProvidersOverviewProps {
  stats: IntegrationStats | null
  isLoading: boolean
}

const providerIcons: Record<string, typeof Calendar> = {
  google: Calendar,
  zoom: Video,
  "google-meet": Video,
  hotmart: CreditCard,
  stripe: CreditCard,
  s3: HardDrive,
}

export function ProvidersOverview({ stats, isLoading }: ProvidersOverviewProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-48 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const totalEmpresas = stats?.totalEmpresas || 1

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-medium mb-6">Status por Provedor</h3>

      <div className="space-y-4">
        {stats?.integrationsByProvider.map((provider) => {
          const Icon = providerIcons[provider.providerId] || Calendar
          const connectedPercent = (provider.connected / totalEmpresas) * 100
          const errorPercent = (provider.error / totalEmpresas) * 100
          const disconnected = totalEmpresas - provider.connected - provider.error

          return (
            <div
              key={provider.providerId}
              className="p-4 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background border">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium">{provider.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span>{provider.connected}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{disconnected}</span>
                  </div>
                  {provider.error > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
                      <span>{provider.error}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex gap-1 h-2">
                  <div
                    className="bg-green-500 rounded-l-full"
                    style={{ width: `${connectedPercent}%` }}
                  />
                  {errorPercent > 0 && (
                    <div
                      className="bg-orange-500"
                      style={{ width: `${errorPercent}%` }}
                    />
                  )}
                  <div
                    className="bg-muted rounded-r-full flex-1"
                    style={{
                      width: `${100 - connectedPercent - errorPercent}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{connectedPercent.toFixed(0)}% conectado</span>
                  <span>{disconnected} desconectado</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
