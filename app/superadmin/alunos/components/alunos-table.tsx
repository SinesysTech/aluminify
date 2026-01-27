"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  MoreHorizontal,
  ExternalLink,
  Mail,
  GraduationCap,
  BookOpen,
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
} from "@/app/shared/components/dataviz/table"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import { Badge } from "@/components/ui/badge"
import type { AlunoWithEmpresa } from "../types"

interface AlunosTableProps {
  alunos: AlunoWithEmpresa[]
  isLoading: boolean
}

export function AlunosTable({ alunos, isLoading }: AlunosTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cursos</TableHead>
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
                  <Skeleton className="h-5 w-[60px]" />
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

  if (alunos.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Nenhum aluno encontrado</h3>
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
            <TableHead>Aluno</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Cursos</TableHead>
            <TableHead>Cadastro</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunos.map((aluno) => (
            <TableRow key={aluno.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {aluno.fullName || "Sem nome"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {aluno.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {aluno.empresaNome ? (
                  <span className="text-sm">{aluno.empresaNome}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Sem empresa
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="h-3 w-3" />
                  {aluno.totalCursos}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(aluno.createdAt), {
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
                        window.open(`mailto:${aluno.email}`, "_blank")
                      }
                      className="cursor-pointer"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar email
                    </DropdownMenuItem>
                    {aluno.empresaSlug && (
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `/${aluno.empresaSlug}/admin/alunos`,
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
