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
  // Hotmart v2.0.0 Types
  HotmartEventType,
  HotmartPurchaseEventType,
  HotmartSubscriptionEventType,
  HotmartClubEventType,
  HotmartWebhookPayload,
  HotmartPurchasePayload,
  HotmartCartAbandonmentPayload,
  HotmartSubscriptionCancellationPayload,
  HotmartSwitchPlanPayload,
  HotmartUpdateChargeDatePayload,
  HotmartClubFirstAccessPayload,
  HotmartBuyer,
  HotmartSubscriber,
  HotmartProduct,
  HotmartPlan,
  HotmartPurchase,
  HotmartSubscription,
  HotmartAddress,
  HotmartPhone,
  // Import
  TransactionImportRow,
  TransactionImportResult,
} from '@/app/shared/types/entities/financial';
