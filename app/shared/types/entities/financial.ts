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
// Hotmart Webhook Types (v2.0.0)
// ============================================================================

/**
 * Purchase Events - Eventos de Compra
 */
export type HotmartPurchaseEventType =
  | 'PURCHASE_APPROVED'
  | 'PURCHASE_COMPLETE'
  | 'PURCHASE_CANCELED'
  | 'PURCHASE_REFUNDED'
  | 'PURCHASE_CHARGEBACK'
  | 'PURCHASE_PROTEST'
  | 'PURCHASE_DELAYED'
  | 'PURCHASE_BILLET_PRINTED'
  | 'PURCHASE_OUT_OF_SHOPPING_CART';

/**
 * Subscription Events - Eventos de Assinatura
 */
export type HotmartSubscriptionEventType =
  | 'SUBSCRIPTION_CANCELLATION'
  | 'SWITCH_PLAN'
  | 'UPDATE_SUBSCRIPTION_CHARGE_DATE';

/**
 * Club Events - Eventos de Área de Membros
 */
export type HotmartClubEventType = 'CLUB_FIRST_ACCESS';

/**
 * All Hotmart Events
 */
export type HotmartEventType =
  | HotmartPurchaseEventType
  | HotmartSubscriptionEventType
  | HotmartClubEventType;

/**
 * Common address structure
 */
export interface HotmartAddress {
  city?: string;
  state?: string;
  country?: string;
  neighborhood?: string;
  number?: string;
  complement?: string;
  zipcode?: string;
}

/**
 * Common phone structure
 */
export interface HotmartPhone {
  dddPhone?: string;
  phone?: string;
  dddCell?: string;
  cell?: string;
}

/**
 * Buyer data for purchase events
 */
export interface HotmartBuyer {
  email: string;
  name: string;
  document?: string;
  phone?: string | HotmartPhone;
  address?: HotmartAddress;
}

/**
 * Subscriber data for subscription events
 */
export interface HotmartSubscriber {
  code: string;
  name: string;
  email: string;
  phone?: HotmartPhone;
}

/**
 * Product data
 */
export interface HotmartProduct {
  id: number;
  name: string;
  ucode?: string;
}

/**
 * Plan data for subscriptions
 */
export interface HotmartPlan {
  id: number;
  name: string;
  offer?: {
    code: string;
    key?: string;
  };
  current?: boolean;
}

/**
 * Purchase data
 */
export interface HotmartPurchase {
  transaction: string;
  status: string;
  approved_date?: number;
  order_date?: number;
  payment: {
    type: string;
    installments_number?: number;
    method?: string;
  };
  price: {
    value: number;
    currency_code: string;
  };
  full_price?: {
    value: number;
    currency_code: string;
  };
  buyer_ip?: string;
  order_bump?: {
    is_order_bump?: boolean;
    parent_purchase_transaction?: string;
  };
}

/**
 * Subscription data
 */
export interface HotmartSubscription {
  id?: number;
  subscriber_code?: string;
  status: string;
  date_next_charge?: number;
  product?: HotmartProduct;
  plan?: HotmartPlan;
  user?: {
    email: string;
  };
}

/**
 * Base webhook payload structure (v2.0.0)
 * Note: hottok is sent in header X-HOTMART-HOTTOK, not in body
 */
export interface HotmartWebhookPayloadBase {
  id: string; // Unique event identifier (UUID)
  creation_date: number; // Unix timestamp in milliseconds
  event: HotmartEventType;
  version: string; // "2.0.0"
}

/**
 * Purchase Event Payload (PURCHASE_*)
 */
export interface HotmartPurchasePayload extends HotmartWebhookPayloadBase {
  event: HotmartPurchaseEventType;
  data: {
    product: HotmartProduct;
    offer?: {
      code: string;
    };
    buyer: HotmartBuyer;
    purchase: HotmartPurchase;
    subscription?: HotmartSubscription;
    origin?: {
      sck?: string;
      src?: string;
      xcode?: string;
    };
  };
}

/**
 * Cart Abandonment Event Payload (PURCHASE_OUT_OF_SHOPPING_CART)
 */
export interface HotmartCartAbandonmentPayload extends HotmartWebhookPayloadBase {
  event: 'PURCHASE_OUT_OF_SHOPPING_CART';
  data: {
    affiliate: boolean;
    product: HotmartProduct;
    buyer?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    offer: {
      code: string;
    };
    checkout_country: {
      name: string;
      iso: string;
    };
  };
}

/**
 * Subscription Cancellation Event Payload
 */
export interface HotmartSubscriptionCancellationPayload extends HotmartWebhookPayloadBase {
  event: 'SUBSCRIPTION_CANCELLATION';
  data: {
    date_next_charge: number;
    product: HotmartProduct;
    actual_recurrence_value: number;
    subscriber: HotmartSubscriber;
    subscription: {
      id: number;
      plan: HotmartPlan;
    };
    cancellation_date: number;
  };
}

/**
 * Switch Plan Event Payload
 */
export interface HotmartSwitchPlanPayload extends HotmartWebhookPayloadBase {
  event: 'SWITCH_PLAN';
  data: {
    switch_plan_date: number;
    subscription: {
      subscriber_code: string;
      status: string;
      date_next_charge: number;
      product: HotmartProduct;
      user: {
        email: string;
      };
    };
    plans: HotmartPlan[];
  };
}

/**
 * Update Subscription Charge Date Event Payload
 */
export interface HotmartUpdateChargeDatePayload extends HotmartWebhookPayloadBase {
  event: 'UPDATE_SUBSCRIPTION_CHARGE_DATE';
  data: {
    subscriber: {
      name: string;
      email: string;
      code: string;
    };
    subscription: {
      product: HotmartProduct;
      old_charge_day: number;
      new_charge_day: number;
      date_next_charge: number;
      status: string;
    };
    plan: HotmartPlan;
  };
}

/**
 * Club First Access Event Payload
 */
export interface HotmartClubFirstAccessPayload extends HotmartWebhookPayloadBase {
  event: 'CLUB_FIRST_ACCESS';
  data: {
    product: HotmartProduct;
    user: {
      name: string;
      email: string;
    };
  };
}

/**
 * Union type for all Hotmart webhook payloads
 */
export type HotmartWebhookPayload =
  | HotmartPurchasePayload
  | HotmartCartAbandonmentPayload
  | HotmartSubscriptionCancellationPayload
  | HotmartSwitchPlanPayload
  | HotmartUpdateChargeDatePayload
  | HotmartClubFirstAccessPayload;

/**
 * @deprecated Use HotmartPurchasePayload instead
 * Legacy type for backwards compatibility
 */
export interface HotmartWebhookPayloadLegacy {
  hottok: string;
  data: {
    product: HotmartProduct;
    offer?: { code: string };
    buyer: HotmartBuyer;
    purchase: HotmartPurchase;
    subscription?: HotmartSubscription;
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
