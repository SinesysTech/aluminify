/**
 * Financial Module Types
 * Re-exports from shared entities for backend usage
 */
export type {
  // Enums
  TransactionStatus,
  PaymentMethod,
  DiscountType,
  Provider,
  // Transaction
  Transaction,
  TransactionSummary,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionStats,
  TransactionListParams,
  // Product
  Product,
  ProductSummary,
  CreateProductInput,
  UpdateProductInput,
  // Coupon
  Coupon,
  CreateCouponInput,
  UpdateCouponInput,
  // Payment Provider
  PaymentProvider,
  CreatePaymentProviderInput,
  UpdatePaymentProviderInput,
  // Hotmart
  HotmartEventType,
  HotmartWebhookPayload,
  // Import
  TransactionImportRow,
  TransactionImportResult,
} from '@/types/shared/entities/financial';
