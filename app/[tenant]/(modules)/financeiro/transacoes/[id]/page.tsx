import { createClient } from "@/app/shared/core/server";
import { requireUser } from "@/app/shared/core/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TransactionStatusBadge } from "@/app/[tenant]/(modules)/financeiro/components/transaction-status-badge";
import { createFinancialService } from "@/app/[tenant]/(modules)/financeiro/services";
import type { TransactionStatus, Provider, PaymentMethod } from "@/app/shared/types/entities/financial";
import { ArrowLeft, User, CreditCard, Calendar, Package, Hash } from "lucide-react";

interface Transaction {
  id: string;
  empresaId: string;
  alunoId: string | null;
  productId: string | null;
  couponId: string | null;
  provider: Provider;
  providerTransactionId: string | null;
  status: TransactionStatus;
  amountCents: number;
  currency: string;
  paymentMethod: PaymentMethod | null;
  installments: number | null;
  buyerEmail: string;
  buyerName: string | null;
  buyerDocument: string | null;
  providerData: Record<string, unknown>;
  saleDate: string;
  confirmationDate: string | null;
  refundDate: string | null;
  refundAmountCents: number | null;
  createdAt: string;
  updatedAt: string;
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

function formatDocument(doc: string | null): string {
  if (!doc) return "-";
  // Format CPF
  if (doc.length === 11) {
    return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  // Format CNPJ
  if (doc.length === 14) {
    return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return doc;
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
  bank_transfer: "Transferência Bancária",
  other: "Outro",
};

export default async function TransacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string; tenant: string }>;
}) {
  await requireUser({ allowedRoles: ["usuario"] });

  const { id, tenant } = await params;
  const supabase = await createClient();
  const financialService = createFinancialService(supabase);

  let transaction: Transaction | null = null;

  try {
    const result = await financialService.getTransaction(id);
    if (result) {
      transaction = {
        id: result.id,
        empresaId: result.empresaId,
        alunoId: result.alunoId,
        productId: result.productId,
        couponId: result.couponId,
        provider: result.provider,
        providerTransactionId: result.providerTransactionId,
        status: result.status,
        amountCents: result.amountCents,
        currency: result.currency,
        paymentMethod: result.paymentMethod,
        installments: result.installments,
        buyerEmail: result.buyerEmail,
        buyerName: result.buyerName,
        buyerDocument: result.buyerDocument,
        providerData: result.providerData as Record<string, unknown>,
        saleDate: result.saleDate.toISOString(),
        confirmationDate: result.confirmationDate?.toISOString() ?? null,
        refundDate: result.refundDate?.toISOString() ?? null,
        refundAmountCents: result.refundAmountCents,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      };
    }
  } catch (error) {
    console.error("Error fetching transaction:", error);
  }

  if (!transaction) {
    notFound();
  }

  const providerData = transaction.providerData || {};

  return (
    <div className="flex-1 mx-auto w-full max-w-7xl space-y-6 px-4 pb-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${tenant}/financeiro/transacoes`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">
              Detalhes da Transação
            </h1>
            <p className="page-subtitle font-mono">
              {transaction.id}
            </p>
          </div>
        </div>
        <TransactionStatusBadge status={transaction.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Comprador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Comprador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{transaction.buyerName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{transaction.buyerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                <p className="font-medium font-mono">
                  {formatDocument(transaction.buyerDocument)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aluno Vinculado</p>
                <p className="font-medium">
                  {transaction.alunoId ? (
                    <Badge variant="outline">Vinculado</Badge>
                  ) : (
                    <Badge variant="secondary">Não vinculado</Badge>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="metric-value">
                  {formatCurrency(transaction.amountCents, transaction.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                <p className="font-medium">
                  {transaction.paymentMethod
                    ? paymentMethodLabels[transaction.paymentMethod] || transaction.paymentMethod
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parcelas</p>
                <p className="font-medium">{transaction.installments || 1}x</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moeda</p>
                <p className="font-medium">{transaction.currency}</p>
              </div>
            </div>

            {transaction.refundDate && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-muted-foreground">Reembolso</p>
                <p className="font-medium text-destructive">
                  {formatCurrency(transaction.refundAmountCents || 0, transaction.currency)}
                  {" em "}
                  {formatDate(transaction.refundDate)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações da Origem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Origem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Provedor</p>
                <p className="font-medium">
                  {providerLabels[transaction.provider] || transaction.provider}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID da Transação</p>
                <p className="font-medium font-mono text-sm">
                  {transaction.providerTransactionId || "-"}
                </p>
              </div>
              {transaction.productId && (
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">
                    <Badge variant="outline">Vinculado</Badge>
                  </p>
                </div>
              )}
              {transaction.couponId && (
                <div>
                  <p className="text-sm text-muted-foreground">Cupom</p>
                  <p className="font-medium">
                    <Badge variant="outline">Aplicado</Badge>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data da Venda</p>
                <p className="font-medium">{formatDate(transaction.saleDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Confirmação</p>
                <p className="font-medium">
                  {transaction.confirmationDate
                    ? formatDate(transaction.confirmationDate)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(transaction.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{formatDate(transaction.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dados do Provedor */}
      {Object.keys(providerData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Dados do Provedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(providerData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
