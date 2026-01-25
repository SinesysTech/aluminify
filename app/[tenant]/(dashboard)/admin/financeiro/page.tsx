import type { Metadata } from 'next'
import { createClient } from "@/lib/server";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StatsCards } from "./components/stats-cards";
import { RecentTransactions } from "./components/recent-transactions";
import { createFinancialService } from "@/backend/services/financial";
import type { TransactionStatus, Provider } from "@/types/shared/entities/financial";

export const metadata: Metadata = {
  title: 'Financeiro'
}

interface TransactionStats {
  totalAmountCents: number;
  totalAmount: number;
  transactionCount: number;
  averageTicketCents: number;
  averageTicket: number;
  byStatus: Record<TransactionStatus, number>;
  byPaymentMethod: Record<string, number>;
}

export default async function FinanceiroPage() {
  const user = await requireUser({ allowedRoles: ["superadmin", "usuario"] });

  const supabase = await createClient();
  const financialService = createFinancialService(supabase);

  let stats: TransactionStats | null = null;
  let recentTransactions: Array<{
    id: string;
    buyerEmail: string;
    buyerName: string | null;
    amountCents: number;
    currency: string;
    status: TransactionStatus;
    provider: Provider;
    saleDate: string;
  }> = [];

  try {
    const [statsResult, transactionsResult] = await Promise.all([
      user.empresaId ? financialService.getTransactionStats(user.empresaId) : null,
      user.empresaId
        ? financialService.listTransactions({
          empresaId: user.empresaId,
          pageSize: 10,
          sortBy: "sale_date",
          sortOrder: "desc",
        })
        : null,
    ]);

    if (statsResult) {
      stats = {
        totalAmountCents: statsResult.totalAmountCents,
        totalAmount: statsResult.totalAmountCents / 100,
        transactionCount: statsResult.transactionCount,
        averageTicketCents: statsResult.averageTicketCents,
        averageTicket: statsResult.averageTicketCents / 100,
        byStatus: statsResult.byStatus,
        byPaymentMethod: statsResult.byPaymentMethod,
      };
    }

    if (transactionsResult) {
      recentTransactions = transactionsResult.data.map((t) => ({
        id: t.id,
        buyerEmail: t.buyerEmail,
        buyerName: t.buyerName,
        amountCents: t.amountCents,
        currency: t.currency,
        status: t.status,
        provider: t.provider,
        saleDate: t.saleDate.toISOString(),
      }));
    }
  } catch (error) {
    console.error("Error fetching financial data:", error);
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Acompanhe suas vendas e transações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/financeiro/transacoes">Ver Transações</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalAmount={stats?.totalAmount ?? 0}
        transactionCount={stats?.transactionCount ?? 0}
        averageTicket={stats?.averageTicket ?? 0}
      />

      {/* Status Summary */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aprovados</span>
                  <span className="font-medium">{stats.byStatus?.approved ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pendentes</span>
                  <span className="font-medium">{stats.byStatus?.pending ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancelados</span>
                  <span className="font-medium">{stats.byStatus?.cancelled ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reembolsados</span>
                  <span className="font-medium">{stats.byStatus?.refunded ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(stats.byPaymentMethod || {}).map(([method, count]) => (
                  <div key={method} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">
                      {method === "credit_card"
                        ? "Cartão de Crédito"
                        : method === "pix"
                          ? "PIX"
                          : method === "boleto"
                            ? "Boleto"
                            : method}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.byPaymentMethod || {}).length === 0 && (
                  <span className="text-muted-foreground">Sem dados</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/financeiro/transacoes">
                  Ver Todas as Transações
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                Exportar Relatório (em breve)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactions transactions={recentTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
