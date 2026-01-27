"use client"

import { Building2, Users, BookOpen } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/dataviz/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import type { TopEmpresa } from "../types"

interface TopEmpresasProps {
  data: TopEmpresa[]
  isLoading: boolean
}

const planColors: Record<string, "default" | "secondary" | "outline"> = {
  basico: "secondary",
  profissional: "default",
  enterprise: "outline",
}

export function TopEmpresasTable({ data, isLoading }: TopEmpresasProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-40 mb-6" />
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
      <h3 className="text-lg font-medium mb-6">Top Empresas por Usuários</h3>

      {data.length === 0 ? (
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
              <TableHead className="text-center">Usuários</TableHead>
              <TableHead className="text-center">Cursos</TableHead>
              <TableHead>Plano</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((empresa, index) => (
              <TableRow key={empresa.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{empresa.nome}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{empresa.totalUsuarios}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{empresa.totalCursos}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={planColors[empresa.plano] || "secondary"}>
                    {empresa.plano.charAt(0).toUpperCase() +
                      empresa.plano.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
