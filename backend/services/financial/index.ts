/**
 * Financial Module
 * Exports all financial services, repositories, and types
 */

// Types
export * from "./financial.types";

// Repositories
export {
  TransactionRepositoryImpl,
  createTransactionRepository,
  type TransactionRepository,
  type PaginatedResult,
} from "./transaction.repository";

export {
  ProductRepositoryImpl,
  createProductRepository,
  type ProductRepository,
  type ProductListParams,
} from "./product.repository";

export {
  CouponRepositoryImpl,
  createCouponRepository,
  type CouponRepository,
  type CouponListParams,
} from "./coupon.repository";

// Services
export {
  FinancialServiceImpl,
  createFinancialService,
  type FinancialService,
} from "./financial.service";
