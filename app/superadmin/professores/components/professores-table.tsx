"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  MoreHorizontal,
  ExternalLink,
  Mail,
  Shield,
  User,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/shared/components/overlay/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/data/table"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import { Badge } from "@/components/ui/badge"
import type { ProfessorWithEmpresa } from "../types"

interface ProfessoresTableProps {
  professores: ProfessorWithEmpresa[]
  isLoading: boolean
}

export function ProfessoresTable({
  professores,
  isLoading,
}: ProfessoresTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Professor</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (professores.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Nenhum professor encontrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente ajustar os filtros de busca
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Professor</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Especialidade</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Cadastro</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {professores.map((professor) => (
            <TableRow key={professor.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {professor.fullName || "Sem nome"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {professor.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {professor.empresaNome ? (
                  <span className="text-sm">{professor.empresaNome}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Sem empresa
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {professor.specialty || "-"}
                </span>
              </TableCell>
              <TableCell>
                {professor.isAdmin ? (
                  <Badge variant="default" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary">Professor</Badge>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(professor.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(`mailto:${professor.email}`, "_blank")
                      }
                      className="cursor-pointer"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar email
                    </DropdownMenuItem>
                    {professor.empresaSlug && (
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `/${professor.empresaSlug}/admin/professores`,
                            "_blank"
                          )
                        }
                        className="cursor-pointer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver na empresa
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
