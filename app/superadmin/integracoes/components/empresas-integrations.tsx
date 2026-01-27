"use client"

import { useState } from "react"
import { Building2, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/dataviz/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/components/forms/select"
import { Input } from "@/app/shared/components/forms/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { EmpresaIntegration, IntegrationStatus } from "../types"

interface EmpresasIntegrationsProps {
  data: EmpresaIntegration[]
  isLoading: boolean
}

const statusConfig: Record<
  IntegrationStatus,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  connected: {
    label: "Conectado",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  disconnected: {
    label: "Desconectado",
    icon: XCircle,
    color: "text-muted-foreground",
  },
  error: {
    label: "Erro",
    icon: AlertCircle,
    color: "text-orange-600",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    color: "text-blue-600",
  },
}

const providers = [
  { id: "google", name: "Google" },
  { id: "zoom", name: "Zoom" },
  { id: "google-meet", name: "Meet" },
  { id: "hotmart", name: "Hotmart" },
  { id: "stripe", name: "Stripe" },
  { id: "s3", name: "S3" },
]

export function EmpresasIntegrations({
  data,
  isLoading,
}: EmpresasIntegrationsProps) {
  const [search, setSearch] = useState("")
  const [filterProvider, setFilterProvider] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredData = data.filter((empresa) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      if (
        !empresa.empresaNome.toLowerCase().includes(searchLower) &&
        !empresa.empresaSlug.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }

    // Provider and status filter
    if (filterProvider !== "all" || filterStatus !== "all") {
      const integration = empresa.integrations.find(
        (i) => filterProvider === "all" || i.providerId === filterProvider
      )

      if (!integration) return false

      if (filterStatus !== "all" && integration.status !== filterStatus) {
        return false
      }
    }

    return true
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-48 mb-6" />
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-medium mb-6">Integrações por Empresa</h3>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Input
          placeholder="Buscar empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Provedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos provedores</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="connected">Conectado</SelectItem>
            <SelectItem value="disconnected">Desconectado</SelectItem>
            <SelectItem value="error">Com erro</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-8">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhuma empresa encontrada
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Empresa</TableHead>
                <TableHead>Plano</TableHead>
                {providers.map((p) => (
                  <TableHead key={p.id} className="text-center">
                    {p.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.slice(0, 20).map((empresa) => (
                <TableRow key={empresa.empresaId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{empresa.empresaNome}</span>
                      <span className="text-xs text-muted-foreground">
                        {empresa.empresaSlug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {empresa.plano.charAt(0).toUpperCase() +
                        empresa.plano.slice(1)}
                    </Badge>
                  </TableCell>
                  {providers.map((provider) => {
                    const integration = empresa.integrations.find(
                      (i) => i.providerId === provider.id
                    )
                    const status = integration?.status || "disconnected"
                    const config = statusConfig[status]
                    const Icon = config.icon

                    return (
                      <TableCell key={provider.id} className="text-center">
                        <div
                          className="flex items-center justify-center"
                          title={
                            integration?.lastSync
                              ? `Último sync: ${formatDistanceToNow(
                                new Date(integration.lastSync),
                                { locale: ptBR, addSuffix: true }
                              )}`
                              : config.label
                          }
                        >
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filteredData.length > 20 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Mostrando 20 de {filteredData.length} empresas
        </div>
      )}
    </div>
  )
}
