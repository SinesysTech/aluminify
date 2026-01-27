/**
 * Types for Super Admin Financeiro Global module
 */

export type TransactionStatus =
  | "pending"
  | "approved"
  | "cancelled"
  | "refunded"
  | "disputed"
  | "chargeback"

export type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "pix"
  | "boleto"
  | "bank_transfer"
  | "other"

export interface GlobalFinancialStats {
  // Summary
  totalRevenueCents: number
  totalTransactions: number
  averageTicketCents: number
  // MRR approximation (last 30 days)
  mrrCents: number
  // Growth
  revenueGrowthPercent: number
  transactionGrowthPercent: number
  // By status
  byStatus: Record<TransactionStatus, { count: number; amountCents: number }>
  // By payment method
  byPaymentMethod: Record<string, { count: number; amountCents: number }>
}

export interface RevenueByEmpresa {
  empresaId: string
  empresaNome: string
  empresaSlug: string
  plano: string
  totalRevenueCents: number
  totalTransactions: number
  lastTransactionDate: string | null
}

export interface MonthlyRevenue {
  month: string
  revenueCents: number
  transactionCount: number
}

export interface RecentTransaction {
  id: string
  empresaId: string
  empresaNome: string
  buyerEmail: string
  buyerName: string | null
  amountCents: number
  status: TransactionStatus
  paymentMethod: PaymentMethod | null
  provider: string
  saleDate: string
}

export interface GlobalFinancialData {
  stats: GlobalFinancialStats
  revenueByEmpresa: RevenueByEmpresa[]
  monthlyRevenue: MonthlyRevenue[]
  recentTransactions: RecentTransaction[]
}

export interface FinanceiroFilters {
  dateFrom: string | null
  dateTo: string | null
  empresaId: "all" | string
}
