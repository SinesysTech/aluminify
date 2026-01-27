"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Receipt, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
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
import type { RecentTransaction, TransactionStatus } from "../types"

interface RecentTransactionsProps {
  data: RecentTransaction[]
  isLoading: boolean
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100)
}

const statusConfig: Record<
  TransactionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
  approved: { label: "Aprovada", variant: "default", icon: CheckCircle2 },
  pending: { label: "Pendente", variant: "secondary", icon: Clock },
  cancelled: { label: "Cancelada", variant: "outline", icon: XCircle },
  refunded: { label: "Reembolsada", variant: "outline", icon: XCircle },
  disputed: { label: "Disputada", variant: "destructive", icon: AlertCircle },
  chargeback: { label: "Chargeback", variant: "destructive", icon: AlertCircle },
}

const METHOD_LABELS: Record<string, string> = {
  credit_card: "Cartão",
  debit_card: "Débito",
  pix: "PIX",
  boleto: "Boleto",
  bank_transfer: "TED",
  other: "Outro",
}

export function RecentTransactions({
  data,
  isLoading,
}: RecentTransactionsProps) {
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
      <h3 className="text-lg font-medium mb-6">Transações Recentes</h3>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <Receipt className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhuma transação encontrada
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comprador</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((transaction) => {
              const status = statusConfig[transaction.status] || statusConfig.pending
              const StatusIcon = status.icon

              return (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {transaction.buyerName || "Sem nome"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.buyerEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{transaction.empresaNome}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {formatCurrency(transaction.amountCents)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {METHOD_LABELS[transaction.paymentMethod || "other"]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.saleDate), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
