# Tasks: Financial Module

## 1. Database Schema

- [x] 1.1 Criar migration para tabela `products`
  - Campos: id, empresa_id, curso_id, name, description, price_cents, currency, provider, provider_product_id, provider_offer_id, active, metadata, created_at, updated_at
  - RLS policies para isolamento multi-tenant
  - Índices: empresa_id, curso_id, provider_product_id

- [x] 1.2 Criar migration para tabela `transactions`
  - Campos: id, empresa_id, aluno_id, product_id, coupon_id, provider, provider_transaction_id, status, amount_cents, currency, payment_method, installments, buyer_email, buyer_name, buyer_document, provider_data, sale_date, confirmation_date, created_at, updated_at
  - RLS policies para isolamento multi-tenant
  - Índices: empresa_id, aluno_id, provider_transaction_id, status, sale_date
  - Constraint UNIQUE em (empresa_id, provider, provider_transaction_id)

- [x] 1.3 Criar migration para tabela `coupons`
  - Campos: id, empresa_id, code, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, active, created_at, updated_at
  - RLS policies para isolamento multi-tenant
  - Índice UNIQUE em (empresa_id, code)

- [x] 1.4 Criar migration para tabela `payment_providers`
  - Campos: id, empresa_id, provider, name, credentials (encrypted jsonb), webhook_secret, active, created_at, updated_at
  - RLS policies para isolamento multi-tenant

- [x] 1.5 Atualizar `lib/database.types.ts` com novos tipos

## 2. Backend - Types e Interfaces

- [x] 2.1 Criar `backend/services/financial/financial.types.ts`
  - Transaction, Product, Coupon, PaymentProvider interfaces
  - CreateTransactionInput, UpdateTransactionInput
  - CreateProductInput, UpdateProductInput
  - TransactionStatus enum
  - PaymentMethod enum
  - Provider enum

- [x] 2.2 Criar `types/shared/entities/financial.ts`
  - DTOs para API responses
  - TransactionSummary, ProductSummary

## 3. Backend - Repositories

- [x] 3.1 Criar `backend/services/financial/transaction.repository.ts`
  - list(params): PaginatedResult<Transaction>
  - findById(id): Transaction | null
  - findByProviderTransactionId(provider, providerTxId): Transaction | null
  - create(input): Transaction
  - update(id, input): Transaction
  - getStats(empresaId, dateRange): TransactionStats

- [x] 3.2 Criar `backend/services/financial/product.repository.ts`
  - list(params): PaginatedResult<Product>
  - findById(id): Product | null
  - findByProviderProductId(provider, productId): Product | null
  - create(input): Product
  - update(id, input): Product
  - delete(id): void

- [x] 3.3 Criar `backend/services/financial/coupon.repository.ts`
  - list(params): PaginatedResult<Coupon>
  - findByCode(empresaId, code): Coupon | null
  - create(input): Coupon
  - update(id, input): Coupon
  - incrementUse(id): void
  - validateCoupon(empresaId, code): ValidationResult

## 4. Backend - Services

- [x] 4.1 Criar `backend/services/financial/financial.service.ts`
  - processTransaction(input): Transaction
  - linkTransactionToStudent(transactionId, studentId): void
  - getTransactionStats(empresaId, dateRange): Stats
  - importTransactionsFromCsv(file, empresaId): ImportResult

- [x] 4.2 Criar `backend/services/financial/hotmart.service.ts` (integrado ao financial.service.ts)
  - validateWebhookSignature(hottok, payload): boolean
  - parseWebhookPayload(payload): HotmartTransaction
  - processWebhook(payload): Transaction
  - syncProduct(hotmartProduct): Product

## 5. Backend - API Routes

- [x] 5.1 Criar `app/api/financial/transactions/route.ts`
  - GET: listar transações com filtros
  - POST: criar transação manual

- [x] 5.2 Criar `app/api/financial/transactions/[id]/route.ts`
  - GET: detalhes da transação
  - PATCH: atualizar transação

- [x] 5.3 Criar `app/api/financial/transactions/stats/route.ts`
  - GET: métricas e resumo

- [x] 5.4 Criar `app/api/financial/transactions/import/route.ts`
  - POST: importar transações de arquivo

- [x] 5.5 Criar `app/api/financial/products/route.ts`
  - GET: listar produtos
  - POST: criar produto

- [x] 5.6 Criar `app/api/financial/products/[id]/route.ts`
  - GET, PATCH, DELETE

- [x] 5.7 Criar `app/api/financial/coupons/route.ts`
  - GET: listar cupons
  - POST: criar cupom
  - Criar `app/api/financial/coupons/[id]/route.ts` - GET, PATCH, DELETE
  - Criar `app/api/financial/coupons/validate/route.ts` - POST validar cupom

- [x] 5.8 Criar `app/api/webhooks/hotmart/route.ts`
  - POST: receber webhook da Hotmart
  - Validar assinatura
  - Processar evento (purchase_approved, purchase_canceled, etc.)

## 6. Frontend - Dashboard Financeiro

- [x] 6.1 Criar `app/(modules)/financeiro/page.tsx`
  - Cards com métricas: total vendas, ticket médio, conversão
  - Gráfico de vendas por período
  - Lista de transações recentes
  - Filtros por período

- [x] 6.2 Criar componentes de métricas
  - `components/financial/stats-cards.tsx`
  - `components/financial/sales-chart.tsx`
  - `components/financial/recent-transactions.tsx`

## 7. Frontend - Transações

- [x] 7.1 Criar `app/(modules)/financeiro/transacoes/page.tsx`
  - Tabela de transações com paginação
  - Filtros: status, período, provedor, produto
  - Busca por email/nome
  - Export para CSV

- [x] 7.2 Criar `app/(modules)/financeiro/transacoes/[id]/page.tsx`
  - Detalhes completos da transação
  - Dados do comprador
  - Timeline de eventos
  - Ações (vincular aluno, reprocessar)

- [x] 7.3 Criar componentes de transações
  - `components/financial/transaction-table.tsx`
  - `components/financial/transaction-filters.tsx`
  - `components/financial/transaction-details.tsx`
  - `components/financial/transaction-status-badge.tsx`

## 8. Frontend - Produtos

- [x] 8.1 Criar `app/(modules)/financeiro/produtos/page.tsx`
  - Lista de produtos com filtros
  - Busca por nome/ID
  - Ações de editar/excluir

- [x] 8.2 Criar `app/(modules)/financeiro/produtos/novo/page.tsx`
  - Formulário de criação de produto

- [x] 8.3 Criar páginas de detalhe e edição
  - `app/(modules)/financeiro/produtos/[id]/page.tsx`
  - `app/(modules)/financeiro/produtos/[id]/editar/page.tsx`

## 9. Frontend - Cupons

- [x] 9.1 Criar `app/(modules)/financeiro/cupons/page.tsx`
  - Lista de cupons
  - Criar/editar cupom via dialog
  - Status dinâmico (ativo, expirado, esgotado)
  - Copiar código

## 10. Integração e Testes

- [x] 10.1 Criar script de importação de transações Hotmart
  - `scripts/import-hotmart-transactions.ts`
  - Ler arquivo JSON com transações
  - Criar/atualizar transações
  - Vincular a alunos existentes
  - Criar produtos automaticamente
  - Suporte a --dry-run

- [ ] 10.2 Testar webhook Hotmart
  - Configurar endpoint no Hotmart
  - Testar eventos: purchase_approved, purchase_canceled, purchase_refunded

- [ ] 10.3 Documentar configuração
  - Como configurar webhook na Hotmart
  - Variáveis de ambiente necessárias

## 11. Atualizar Navegação

- [x] 11.1 Adicionar item "Financeiro" no menu admin
  - Ícone e rota
  - Submenu: Dashboard, Transações, Produtos, Cupons

## Prioridade de Implementação

**Fase 1 (MVP): ✅ CONCLUÍDA**
- Tasks 1.1-1.5 (Schema) ✅
- Tasks 2.1-2.2 (Types) ✅
- Tasks 3.1 (Transaction Repository) ✅
- Tasks 4.1-4.2 (Services) ✅
- Tasks 5.1-5.4, 5.8 (API Transações + Webhook) ✅
- Tasks 6.1-6.2 (modules) ✅
- Tasks 7.1-7.3 (Transações) ✅
- Task 10.1 (Script importação) ✅

**Fase 2: ✅ CONCLUÍDA**
- Tasks 3.2-3.3 (Repositories) ✅
- Tasks 5.5-5.7 (API Produtos/Cupons) ✅
- Tasks 8.1-8.3 (Produtos) ✅
- Tasks 9.1 (Cupons) ✅
- Task 11.1 (Navegação) ✅

**Pendente:**
- Task 10.2 (Testar webhook Hotmart)
- Task 10.3 (Documentação)
