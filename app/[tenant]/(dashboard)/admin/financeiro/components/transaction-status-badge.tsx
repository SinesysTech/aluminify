"use client";

import { Badge } from "@/components/ui/badge";
import type { TransactionStatus } from "@/types/shared/entities/financial";

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
}

const statusConfig: Record<
  TransactionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pendente", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  refunded: { label: "Reembolsado", variant: "outline" },
  disputed: { label: "Disputado", variant: "destructive" },
  chargeback: { label: "Chargeback", variant: "destructive" },
};

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary" as const };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
