"use client"

import { useState } from "react"

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Building2,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Users,
  GraduationCap,
  BookOpen,
  MoreHorizontal,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/dataviz/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/shared/components/overlay/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/shared/components/overlay/tooltip"
import { TableSkeleton } from "@/app/shared/components/ui/table-skeleton"
import { cn } from "@/app/shared/library/utils"
import type { EmpresaWithMetrics } from "../types"
import { ToggleStatusDialog } from "./toggle-status-dialog"
import { EditEmpresaDialog } from "./edit-empresa-dialog"

interface EmpresasTableProps {
  empresas: EmpresaWithMetrics[]
  isLoading?: boolean
  onRefresh: () => void
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

export function EmpresasTable({ empresas, isLoading, onRefresh }: EmpresasTableProps) {
  const router = useRouter()
  const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaWithMetrics | null>(null)

  const handleToggleStatus = (empresa: EmpresaWithMetrics) => {
    setSelectedEmpresa(empresa)
    setToggleStatusDialogOpen(true)
  }

  const handleEdit = (empresa: EmpresaWithMetrics) => {
    setSelectedEmpresa(empresa)
    setEditDialogOpen(true)
  }

  if (isLoading) {
    return <TableSkeleton rows={5} columns={7} />
  }

  if (empresas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Nenhuma empresa encontrada</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Não há empresas que correspondam aos filtros selecionados.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Empresa</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Usuários</TableHead>
              <TableHead className="text-center">Alunos</TableHead>
              <TableHead className="text-center">Cursos</TableHead>
              <TableHead className="text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresas.map((empresa) => {
              const planoInfo = planoLabels[empresa.plano] || planoLabels.basico
              const createdAtFormatted = formatDistanceToNow(
                new Date(empresa.createdAt),
                { addSuffix: true, locale: ptBR }
              )

              return (
                <TableRow key={empresa.id} className="group">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                        {empresa.nome
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{empresa.nome}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{empresa.slug}</span>
                          <span>·</span>
                          <span>{createdAtFormatted}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        planoInfo.className
                      )}
                    >
                      {planoInfo.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        empresa.ativo
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {empresa.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex items-center gap-1.5 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{empresa.totalUsuarios}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Professores e Staff</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex items-center gap-1.5 text-sm">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{empresa.totalAlunos}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Alunos matriculados</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex items-center gap-1.5 text-sm">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{empresa.totalCursos}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Cursos criados</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/superadmin/empresas/${empresa.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(empresa)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(empresa)}
                          className={empresa.ativo ? "text-red-600" : "text-emerald-600"}
                        >
                          {empresa.ativo ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ToggleStatusDialog
        empresa={selectedEmpresa}
        open={toggleStatusDialogOpen}
        onOpenChange={setToggleStatusDialogOpen}
        onSuccess={onRefresh}
      />

      <EditEmpresaDialog
        empresa={selectedEmpresa}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={onRefresh}
      />
    </TooltipProvider>
  )
}
