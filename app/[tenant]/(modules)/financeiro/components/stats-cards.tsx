"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, BarChart3 } from "lucide-react";

interface StatsCardsProps {
  totalAmount: number;
  transactionCount: number;
  averageTicket: number;
  currency?: string;
}

function formatCurrency(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

export function StatsCards({
  totalAmount,
  transactionCount,
  averageTicket,
  currency = "BRL",
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="metric-label">Total de Vendas</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="metric-value">
            {formatCurrency(totalAmount, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor total aprovado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="metric-label">Transações</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="metric-value">{transactionCount}</div>
          <p className="text-xs text-muted-foreground">
            Total de vendas aprovadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="metric-label">Ticket Médio</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="metric-value">
            {formatCurrency(averageTicket, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor médio por venda
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="metric-label">Taxa de Conversão</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="metric-value">-</div>
          <p className="text-xs text-muted-foreground">
            Em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
