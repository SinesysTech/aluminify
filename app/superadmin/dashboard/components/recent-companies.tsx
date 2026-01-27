"use client"

import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/dataviz/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { RecentEmpresa } from "@/app/api/superadmin/stats/route"
import { cn } from "@/app/shared/library/utils"

interface RecentCompaniesProps {
  empresas: RecentEmpresa[] | null
  isLoading?: boolean
}

const planoLabels: Record<string, { label: string; className: string }> = {
  basico: {
    label: "Básico",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  profissional: {
    label: "Profissional",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  enterprise: {
    label: "Enterprise",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
}

export function RecentCompanies({ empresas, isLoading = false }: RecentCompaniesProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Empresas Recentes</h3>
            <p className="text-sm text-muted-foreground">
              Últimas empresas cadastradas na plataforma
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link href="/superadmin/empresas">
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Nome</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Usuários</TableHead>
              <TableHead className="pr-6 text-right">Criada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6">
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-5 w-8" />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Skeleton className="ml-auto h-5 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : empresas && empresas.length > 0 ? (
              empresas.map((empresa) => {
                const planoInfo = planoLabels[empresa.plano] || planoLabels.basico
                const createdAtFormatted = formatDistanceToNow(
                  new Date(empresa.createdAt),
                  { addSuffix: true, locale: ptBR }
                )

                return (
                  <TableRow key={empresa.id} className="group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                          {empresa.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/superadmin/empresas/${empresa.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {empresa.nome}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {empresa.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          planoInfo.className
                        )}
                      >
                        {planoInfo.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          empresa.ativo
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        )}
                      >
                        {empresa.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {empresa.totalUsuarios}
                    </TableCell>
                    <TableCell className="pr-6 text-right text-sm text-muted-foreground">
                      {createdAtFormatted}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhuma empresa cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
