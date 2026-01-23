/**
 * Tipos de entidades financeiras compartilhados
 */

// ============================================================================
// Enums
// ============================================================================

export type TransactionStatus =
  | 'pending'
  | 'approved'
  | 'cancelled'
  | 'refunded'
  | 'disputed'
  | 'chargeback';

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'boleto'
  | 'bank_transfer'
  | 'other';

export type DiscountType = 'percentage' | 'fixed';

export type Provider = 'hotmart' | 'stripe' | 'internal' | 'manual';

// ============================================================================
// Transaction
// ============================================================================

export interface Transaction {
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
  saleDate: Date;
  confirmationDate: Date | null;
  refundDate: Date | null;
  refundAmountCents: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionSummary {
  id: string;
  status: TransactionStatus;
  amountCents: number;
  currency: string;
  buyerEmail: string;
  buyerName: string | null;
  productName: string | null;
  provider: Provider;
  saleDate: Date;
}

export interface CreateTransactionInput {
  empresaId: string;
  alunoId?: string | null;
  productId?: string | null;
  couponId?: string | null;
  provider?: Provider;
  providerTransactionId?: string | null;
  status?: TransactionStatus;
  amountCents: number;
  currency?: string;
  paymentMethod?: PaymentMethod | null;
  installments?: number | null;
  buyerEmail: string;
  buyerName?: string | null;
  buyerDocument?: string | null;
  providerData?: Record<string, unknown>;
  saleDate?: Date;
  confirmationDate?: Date | null;
}

export interface UpdateTransactionInput {
  alunoId?: string | null;
  productId?: string | null;
  couponId?: string | null;
  status?: TransactionStatus;
  amountCents?: number;
  paymentMethod?: PaymentMethod | null;
  installments?: number | null;
  buyerName?: string | null;
  buyerDocument?: string | null;
  providerData?: Record<string, unknown>;
  confirmationDate?: Date | null;
  refundDate?: Date | null;
  refundAmountCents?: number | null;
}

export interface TransactionStats {
  totalAmountCents: number;
  transactionCount: number;
  averageTicketCents: number;
  byStatus: Record<TransactionStatus, number>;
  byPaymentMethod: Record<string, number>;
}

export interface TransactionListParams {
  empresaId: string;
  status?: TransactionStatus;
  provider?: Provider;
  productId?: string;
  alunoId?: string;
  buyerEmail?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: 'sale_date' | 'amount_cents' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Product
// ============================================================================

export interface Product {
  id: string;
  empresaId: string;
  cursoId: string | null;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  provider: Provider;
  providerProductId: string | null;
  providerOfferId: string | null;
  active: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSummary {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  active: boolean;
  cursoName: string | null;
}

export interface CreateProductInput {
  empresaId: string;
  cursoId?: string | null;
  name: string;
  description?: string | null;
  priceCents: number;
  currency?: string;
  provider?: Provider;
  providerProductId?: string | null;
  providerOfferId?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateProductInput {
  cursoId?: string | null;
  name?: string;
  description?: string | null;
  priceCents?: number;
  currency?: string;
  providerProductId?: string | null;
  providerOfferId?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Coupon
// ============================================================================

export interface Coupon {
  id: string;
  empresaId: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  validFrom: Date;
  validUntil: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCouponInput {
  empresaId: string;
  code: string;
  description?: string | null;
  discountType?: DiscountType;
  discountValue: number;
  maxUses?: number | null;
  validFrom?: Date;
  validUntil?: Date | null;
  active?: boolean;
}

export interface UpdateCouponInput {
  code?: string;
  description?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  maxUses?: number | null;
  validFrom?: Date;
  validUntil?: Date | null;
  active?: boolean;
}

// ============================================================================
// Payment Provider
// ============================================================================

export interface PaymentProvider {
  id: string;
  empresaId: string;
  provider: Provider;
  name: string;
  credentials: Record<string, unknown>;
  webhookSecret: string | null;
  webhookUrl: string | null;
  providerAccountId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentProviderInput {
  empresaId: string;
  provider: Provider;
  name: string;
  credentials?: Record<string, unknown>;
  webhookSecret?: string | null;
  providerAccountId?: string | null;
  active?: boolean;
}

export interface UpdatePaymentProviderInput {
  name?: string;
  credentials?: Record<string, unknown>;
  webhookSecret?: string | null;
  providerAccountId?: string | null;
  active?: boolean;
}

// ============================================================================
// Hotmart Webhook Types
// ============================================================================

export type HotmartEventType =
  | 'PURCHASE_APPROVED'
  | 'PURCHASE_COMPLETE'
  | 'PURCHASE_CANCELED'
  | 'PURCHASE_REFUNDED'
  | 'PURCHASE_CHARGEBACK'
  | 'PURCHASE_PROTEST'
  | 'PURCHASE_DELAYED';

export interface HotmartWebhookPayload {
  hottok: string;
  data: {
    product: {
      id: number;
      name: string;
      ucode: string;
    };
    offer?: {
      code: string;
    };
    buyer: {
      email: string;
      name: string;
      document?: string;
      phone?: string;
      address?: {
        city?: string;
        state?: string;
        country?: string;
        neighborhood?: string;
        number?: string;
        complement?: string;
        zipcode?: string;
      };
    };
    purchase: {
      transaction: string;
      status: string;
      approved_date?: number;
      payment: {
        type: string;
        installments_number?: number;
      };
      price: {
        value: number;
        currency_code: string;
      };
      full_price?: {
        value: number;
        currency_code: string;
      };
    };
    subscription?: {
      subscriber: {
        code: string;
      };
      status: string;
    };
  };
  event: HotmartEventType;
  creation_date: number;
}

// ============================================================================
// Import Types
// ============================================================================

export interface TransactionImportRow {
  transactionId?: string;
  buyerEmail: string;
  buyerName?: string;
  buyerDocument?: string;
  productName?: string;
  productId?: string;
  amountCents: number;
  currency?: string;
  paymentMethod?: string;
  status?: string;
  saleDate?: Date;
}

export interface TransactionImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: TransactionImportRow;
  }>;
}
