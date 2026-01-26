"use client"

import {
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/data/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AuditLog, LogLevel, LogCategory } from "../types"

interface LogsTableProps {
  logs: AuditLog[]
  isLoading: boolean
  totalFiltered: number
}

const levelConfig: Record<
  LogLevel,
  { label: string; icon: typeof Info; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  info: { label: "Info", icon: Info, variant: "secondary" },
  warning: { label: "Aviso", icon: AlertTriangle, variant: "outline" },
  error: { label: "Erro", icon: AlertCircle, variant: "destructive" },
  success: { label: "Sucesso", icon: CheckCircle2, variant: "default" },
}

const categoryLabels: Record<LogCategory, string> = {
  auth: "Autenticação",
  empresa: "Empresa",
  user: "Usuário",
  curso: "Curso",
  payment: "Pagamento",
  integration: "Integração",
  system: "Sistema",
}

export function LogsTable({ logs, isLoading, totalFiltered }: LogsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-48 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-medium mb-6">Logs de Auditoria</h3>
        <div className="text-center py-8">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum log encontrado
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Logs de Auditoria</h3>
        <span className="text-sm text-muted-foreground">
          {totalFiltered} registros
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Horário</TableHead>
              <TableHead className="w-[100px]">Nível</TableHead>
              <TableHead className="w-[120px]">Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[150px]">Empresa</TableHead>
              <TableHead className="w-[150px]">Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const level = levelConfig[log.level]
              const Icon = level.icon

              return (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.timestamp), {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={level.variant} className="gap-1">
                      <Icon className="h-3 w-3" />
                      {level.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {categoryLabels[log.category]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{log.description}</span>
                      <code className="text-xs text-muted-foreground">
                        {log.action}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.empresaNome ? (
                      <span className="text-sm">{log.empresaNome}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.userName ? (
                      <span className="text-sm">{log.userName}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {logs.length >= 100 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Mostrando os 100 logs mais recentes
        </div>
      )}
    </div>
  )
}
