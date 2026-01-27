"use client"

import { Building2, ExternalLink } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/dataviz/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { RevenueByEmpresa } from "../types"

interface RevenueByEmpresaTableProps {
  data: RevenueByEmpresa[]
  isLoading: boolean
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100)
}

const planColors: Record<string, "default" | "secondary" | "outline"> = {
  basico: "secondary",
  profissional: "default",
  enterprise: "outline",
}

export function RevenueByEmpresaTable({
  data,
  isLoading,
}: RevenueByEmpresaTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-48 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-medium mb-6">Receita por Empresa</h3>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhuma transação encontrada
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead className="text-right">Transações</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((empresa, index) => (
              <TableRow key={empresa.empresaId}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{empresa.empresaNome}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={planColors[empresa.plano] || "secondary"}>
                    {empresa.plano.charAt(0).toUpperCase() +
                      empresa.plano.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(empresa.totalRevenueCents)}
                </TableCell>
                <TableCell className="text-right">
                  {empresa.totalTransactions}
                </TableCell>
                <TableCell>
                  {empresa.empresaSlug && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        window.open(
                          `/${empresa.empresaSlug}/admin/financeiro`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Ver financeiro</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
