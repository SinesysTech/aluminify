"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionStatusBadge } from "./transaction-status-badge";
import type { TransactionStatus, Provider } from "@/types/shared/entities/financial";

interface TransactionRow {
  id: string;
  buyerEmail: string;
  buyerName: string | null;
  amountCents: number;
  currency: string;
  status: TransactionStatus;
  provider: Provider;
  saleDate: string;
}

interface RecentTransactionsProps {
  transactions: TransactionRow[];
}

function formatCurrency(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value / 100);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

const providerLabels: Record<Provider, string> = {
  hotmart: "Hotmart",
  stripe: "Stripe",
  internal: "Interno",
  manual: "Manual",
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma transação encontrada
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Comprador</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Origem</TableHead>
          <TableHead>Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">
                  {transaction.buyerName || "-"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {transaction.buyerEmail}
                </span>
              </div>
            </TableCell>
            <TableCell>
              {formatCurrency(transaction.amountCents, transaction.currency)}
            </TableCell>
            <TableCell>
              <TransactionStatusBadge status={transaction.status} />
            </TableCell>
            <TableCell>
              {providerLabels[transaction.provider] || transaction.provider}
            </TableCell>
            <TableCell>{formatDate(transaction.saleDate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
