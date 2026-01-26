import type { Metadata } from 'next'
import { Suspense } from "react";
import { createClient } from "@/app/shared/core/server";
import { requireUser } from "@/app/shared/core/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TransactionFilters } from "@/app/[tenant]/(modules)/financeiro/components/transaction-filters";
import { TransactionStatusBadge } from "@/app/[tenant]/(modules)/financeiro/components/transaction-status-badge";
import { Skeleton } from "@/app/shared/components/feedback/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/dataviz/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { createFinancialService } from "@/app/[tenant]/(modules)/financeiro/services";
import type { TransactionStatus, Provider } from "@/app/shared/types/entities/financial";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: 'Transações'
}

interface TransactionRow {
  id: string;
  buyerEmail: string;
  buyerName: string | null;
  amountCents: number;
  currency: string;
  status: TransactionStatus;
  provider: Provider;
  saleDate: string;
  paymentMethod: string | null;
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface SearchParams {
  page?: string;
  status?: TransactionStatus;
  provider?: Provider;
  buyerEmail?: string;
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

const paymentMethodLabels: Record<string, string> = {
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  pix: "PIX",
  boleto: "Boleto",
  bank_transfer: "Transferência",
  other: "Outro",
};

export default async function TransacoesPage({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ tenant: string }>;
}) {
  const user = await requireUser({ allowedRoles: ["superadmin", "usuario"] });
  const { tenant } = await params;

  const searchParamsData = await searchParams;
  const supabase = await createClient();
  const financialService = createFinancialService(supabase);

  let transactions: TransactionRow[] = [];
  let meta: PaginationMeta = { page: 1, perPage: 20, total: 0, totalPages: 0 };

  try {
    if (user.empresaId) {
      const result = await financialService.listTransactions({
        empresaId: user.empresaId,
        page: searchParamsData.page ? parseInt(searchParamsData.page, 10) : 1,
        pageSize: 20,
        sortBy: "sale_date",
        sortOrder: "desc",
        status: searchParamsData.status,
        provider: searchParamsData.provider,
        buyerEmail: searchParamsData.buyerEmail,
      });

      transactions = result.data.map((t) => ({
        id: t.id,
        buyerEmail: t.buyerEmail,
        buyerName: t.buyerName,
        amountCents: t.amountCents,
        currency: t.currency,
        status: t.status,
        provider: t.provider,
        saleDate: t.saleDate.toISOString(),
        paymentMethod: t.paymentMethod,
      }));

      meta = {
        page: result.meta.page,
        perPage: result.meta.perPage,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
      };
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }

  const currentPage = meta.page;
  const totalPages = meta.totalPages;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${tenant}/financeiro`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">Transações</h1>
            <p className="page-subtitle">
              {meta.total} transações encontradas
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex gap-4"><Skeleton className="h-10 w-[200px]" /><Skeleton className="h-10 w-[180px]" /><Skeleton className="h-10 w-[180px]" /></div>}>
            <TransactionFilters
              currentStatus={searchParamsData.status}
              currentProvider={searchParamsData.provider}
              currentSearch={searchParamsData.buyerEmail}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {}}
                  >
                    <TableCell>
                      <Link
                        href={`/${tenant}/financeiro/transacoes/${transaction.id}`}
                        className="flex flex-col"
                      >
                        <span className="font-medium">
                          {transaction.buyerName || "-"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {transaction.buyerEmail}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amountCents, transaction.currency)}
                    </TableCell>
                    <TableCell>
                      {transaction.paymentMethod
                        ? paymentMethodLabels[transaction.paymentMethod] || transaction.paymentMethod
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <TransactionStatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell>
                      {providerLabels[transaction.provider] || transaction.provider}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(transaction.saleDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={`?${new URLSearchParams({
                    ...searchParamsData,
                    page: String(currentPage - 1),
                  }).toString()}`}
                />
              </PaginationItem>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href={`?${new URLSearchParams({
                      ...searchParamsData,
                      page: String(pageNum),
                    }).toString()}`}
                    isActive={pageNum === currentPage}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext
                  href={`?${new URLSearchParams({
                    ...searchParamsData,
                    page: String(currentPage + 1),
                  }).toString()}`}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
