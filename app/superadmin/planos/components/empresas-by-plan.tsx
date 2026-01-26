"use client"

import { useState, useEffect, useCallback } from "react"
import { Building2, ArrowUpRight, ArrowDownRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/data/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/components/forms/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/app/shared/core/client"
import type { PlanoId } from "../types"

interface Empresa {
  id: string
  nome: string
  slug: string
  plano: PlanoId
  totalUsuarios: number
  ativo: boolean
}

interface EmpresasByPlanProps {
  onPlanChanged?: () => void
}

const PLAN_ORDER: PlanoId[] = ["basico", "profissional", "enterprise"]

const planColors: Record<PlanoId, "secondary" | "default" | "outline"> = {
  basico: "secondary",
  profissional: "default",
  enterprise: "outline",
}

export function EmpresasByPlan({ onPlanChanged }: EmpresasByPlanProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)
  const [filterPlano, setFilterPlano] = useState<PlanoId | "all">("all")

  const fetchEmpresas = useCallback(async () => {
    try {
      setIsLoading(true)

      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const response = await fetch("/api/superadmin/empresas", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) return

      const data = await response.json()
      setEmpresas(
        (data.data || []).map((e: {
          id: string
          nome: string
          slug: string
          plano: PlanoId
          totalUsuarios: number
          ativo: boolean
        }) => ({
          id: e.id,
          nome: e.nome,
          slug: e.slug,
          plano: e.plano,
          totalUsuarios: e.totalUsuarios,
          ativo: e.ativo,
        }))
      )
    } catch (error) {
      console.error("Error fetching empresas:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmpresas()
  }, [fetchEmpresas])

  const handlePlanChange = async (empresaId: string, newPlano: PlanoId) => {
    setChangingPlan(empresaId)
    try {
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

      const response = await fetch(`/api/superadmin/planos/${empresaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plano: newPlano }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao alterar plano")
      }

      const result = await response.json()

      toast({
        title: "Plano alterado",
        description: result.message,
      })

      // Update local state
      setEmpresas((prev) =>
        prev.map((e) => (e.id === empresaId ? { ...e, plano: newPlano } : e))
      )

      onPlanChanged?.()
    } catch (error) {
      console.error("Error changing plan:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao alterar plano",
      })
    } finally {
      setChangingPlan(null)
    }
  }

  const getPlanChangeIcon = (currentPlan: PlanoId, newPlan: PlanoId) => {
    const currentIndex = PLAN_ORDER.indexOf(currentPlan)
    const newIndex = PLAN_ORDER.indexOf(newPlan)

    if (newIndex > currentIndex) {
      return <ArrowUpRight className="h-3 w-3 text-green-600" />
    } else if (newIndex < currentIndex) {
      return <ArrowDownRight className="h-3 w-3 text-orange-600" />
    }
    return null
  }

  const filteredEmpresas = empresas.filter(
    (e) => filterPlano === "all" || e.plano === filterPlano
  )

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-48 mb-6" />
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Empresas por Plano</h3>
        <Select
          value={filterPlano}
          onValueChange={(v) => setFilterPlano(v as PlanoId | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            <SelectItem value="basico">Básico</SelectItem>
            <SelectItem value="profissional">Profissional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredEmpresas.length === 0 ? (
        <div className="text-center py-8">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhuma empresa encontrada
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Plano Atual</TableHead>
              <TableHead>Alterar Plano</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmpresas.slice(0, 10).map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{empresa.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {empresa.slug}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{empresa.totalUsuarios}</TableCell>
                <TableCell>
                  <Badge variant={planColors[empresa.plano]}>
                    {empresa.plano.charAt(0).toUpperCase() +
                      empresa.plano.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Select
                      value={empresa.plano}
                      onValueChange={(v) =>
                        handlePlanChange(empresa.id, v as PlanoId)
                      }
                      disabled={changingPlan === empresa.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_ORDER.map((plan) => (
                          <SelectItem key={plan} value={plan}>
                            <div className="flex items-center gap-2">
                              {getPlanChangeIcon(empresa.plano, plan)}
                              {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {changingPlan === empresa.id && (
                      <span className="text-xs text-muted-foreground">
                        Salvando...
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {filteredEmpresas.length > 10 && (
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => (window.location.href = "/superadmin/empresas")}
          >
            Ver todas as {filteredEmpresas.length} empresas
          </Button>
        </div>
      )}
    </div>
  )
}
