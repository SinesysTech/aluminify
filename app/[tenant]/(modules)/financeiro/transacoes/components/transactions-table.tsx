'use client'

import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/app/shared/components/dataviz/table'
import { TransactionStatusBadge } from '@/app/[tenant]/(modules)/financeiro/components/transaction-status-badge'
import type { TransactionStatus, Provider } from '@/app/shared/types/entities/financial'

export interface TransactionRow {
    id: string
    buyerEmail: string
    buyerName: string | null
    amountCents: number
    currency: string
    status: TransactionStatus
    provider: Provider
    saleDate: string
    paymentMethod: string | null
}

interface TransactionsTableProps {
    transactions: TransactionRow[]
    tenant: string
}

const providerLabels: Record<Provider, string> = {
    hotmart: 'Hotmart',
    stripe: 'Stripe',
    internal: 'Interno',
    manual: 'Manual',
}

const paymentMethodLabels: Record<string, string> = {
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    boleto: 'Boleto',
    bank_transfer: 'Transferência',
    other: 'Outro',
}

function formatCurrency(value: number, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
    }).format(value / 100)
}

function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString))
}

export function TransactionsTable({ transactions, tenant }: TransactionsTableProps) {
    const router = useRouter()

    if (transactions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Nenhuma transação encontrada
            </div>
        )
    }

    return (
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
                        onClick={() => router.push(`/${tenant}/financeiro/transacoes/${transaction.id}`)}
                    >
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium">
                                    {transaction.buyerName || '-'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {transaction.buyerEmail}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">
                            {formatCurrency(transaction.amountCents, transaction.currency)}
                        </TableCell>
                        <TableCell>
                            {transaction.paymentMethod
                                ? paymentMethodLabels[transaction.paymentMethod] || transaction.paymentMethod
                                : '-'}
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
    )
}
