# Design: Financial Module

## Context

O sistema Aluminify é uma plataforma multi-tenant para cursinhos preparatórios. Atualmente, alunos são cadastrados manualmente ou importados de planilhas da Hotmart.

O objetivo é criar um módulo financeiro flexível que:
- Permita ao cliente escolher entre Hotmart ou checkout próprio
- Rastreie todas as transações de forma unificada
- Prepare a base para funcionalidades futuras de e-commerce

### Stakeholders
- **Administradores**: visualizam relatórios e gerenciam produtos
- **Alunos**: fazem compras (futuro checkout)
- **Sistema**: processa webhooks e sincroniza dados

## Goals / Non-Goals

### Goals
- Criar schema flexível que suporte múltiplos provedores de pagamento
- Implementar webhook handler para Hotmart
- Fornecer dashboard com métricas básicas de vendas
- Manter isolamento multi-tenant em todas as tabelas

### Non-Goals (v1)
- Implementar checkout próprio completo (apenas estrutura)
- Integração com Stripe/outros provedores (apenas schema)
- Sistema de assinaturas/recorrência
- Emissão de notas fiscais
- Split de pagamentos

## Decisions

### 1. Schema de Transações Flexível

**Decision**: Criar tabela `transactions` com campos genéricos + JSONB para dados específicos do provedor.

```sql
transactions (
  id uuid PRIMARY KEY,
  empresa_id uuid NOT NULL,
  aluno_id uuid,                    -- Pode ser NULL antes de vincular
  product_id uuid,
  provider text NOT NULL,           -- 'hotmart', 'stripe', 'manual', 'internal'
  provider_transaction_id text,     -- ID externo
  status text NOT NULL,             -- 'pending', 'approved', 'cancelled', 'refunded'
  amount_cents integer NOT NULL,
  currency text DEFAULT 'BRL',
  payment_method text,              -- 'credit_card', 'pix', 'boleto'
  installments integer DEFAULT 1,
  provider_data jsonb,              -- Dados específicos do provedor
  created_at, updated_at
)
```

**Rationale**: JSONB permite armazenar campos específicos de cada provedor (Hotmart tem campos diferentes de Stripe) sem alterar o schema.

### 2. Produtos Separados de Cursos

**Decision**: Criar tabela `products` separada que referencia `cursos`.

```sql
products (
  id uuid PRIMARY KEY,
  empresa_id uuid NOT NULL,
  curso_id uuid,                    -- Opcional: pode ser produto avulso
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  currency text DEFAULT 'BRL',
  provider text,                    -- 'hotmart', 'internal'
  provider_product_id text,         -- ID na Hotmart
  provider_offer_id text,           -- Código da oferta
  active boolean DEFAULT true,
  metadata jsonb
)
```

**Rationale**: Permite flexibilidade para vender produtos que não são cursos (mentorias, materiais) e ter múltiplas ofertas/preços para o mesmo curso.

### 3. Webhook Idempotente

**Decision**: Usar `provider_transaction_id` como chave de idempotência.

**Rationale**: Hotmart pode enviar o mesmo webhook múltiplas vezes. Usar ON CONFLICT DO UPDATE garante processamento único.

### 4. Vinculação de Aluno

**Decision**: Vincular aluno por email na transação, criar se não existir.

```typescript
// Fluxo do webhook
1. Recebe webhook com email do comprador
2. Busca aluno por email na empresa
3. Se não existe, cria usuário no auth + aluno
4. Vincula transação ao aluno_id
5. Se produto tem curso_id, matricula aluno no curso
```

**Rationale**: Automatiza o fluxo de matrícula quando a compra é confirmada.

## Data Model

```
┌─────────────────┐      ┌─────────────────┐
│    empresas     │      │     cursos      │
└────────┬────────┘      └────────┬────────┘
         │                        │
         │ 1:N                    │ 1:N
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│    products     │──────│   transactions  │
└────────┬────────┘      └────────┬────────┘
         │                        │
         │                        │ N:1
         │                        ▼
         │               ┌─────────────────┐
         └───────────────│     alunos      │
                         └─────────────────┘
                                  │
                                  │ N:N
                                  ▼
                         ┌─────────────────┐
                         │  alunos_cursos  │
                         └─────────────────┘
```

## API Design

### Endpoints

```
GET  /api/financial/transactions          - Listar transações
GET  /api/financial/transactions/:id      - Detalhes da transação
GET  /api/financial/transactions/stats    - Métricas/resumo
POST /api/financial/transactions/import   - Importar de planilha

GET  /api/financial/products              - Listar produtos
POST /api/financial/products              - Criar produto
PUT  /api/financial/products/:id          - Atualizar produto

GET  /api/financial/coupons               - Listar cupons
POST /api/financial/coupons               - Criar cupom

POST /api/webhooks/hotmart                - Webhook Hotmart
```

### Autenticação Webhook

```typescript
// Validar assinatura Hotmart
const isValid = verifyHotmartSignature(
  request.headers['x-hotmart-hottok'],
  process.env.HOTMART_HOTTOK
);
```

## Frontend Structure

```
app/(dashboard)/admin/financeiro/
├── page.tsx                    # Dashboard financeiro
├── transacoes/
│   ├── page.tsx               # Lista de transações
│   └── [id]/page.tsx          # Detalhes da transação
├── produtos/
│   ├── page.tsx               # Lista de produtos
│   └── novo/page.tsx          # Criar produto
└── cupons/
    └── page.tsx               # Gestão de cupons
```

## Risks / Trade-offs

### Risk: Dados inconsistentes entre Hotmart e sistema
**Mitigation**: Webhook como source of truth. Não permitir edição manual de transações importadas.

### Risk: Webhook falha e perde dados
**Mitigation**: Implementar retry com exponential backoff. Hotmart reenvia webhooks que falham.

### Trade-off: JSONB vs colunas tipadas
**Decision**: JSONB para flexibilidade. Pode extrair para colunas se necessário para performance de queries.

## Migration Plan

### Phase 1: Schema (esta change)
1. Criar tabelas base (transactions, products, coupons)
2. Criar índices e RLS policies
3. Criar types TypeScript

### Phase 2: Backend
1. Implementar services e repositories
2. Criar webhook handler Hotmart
3. Implementar endpoints de API

### Phase 3: Frontend
1. Dashboard financeiro básico
2. Listagem de transações
3. Gestão de produtos

### Phase 4: Integração (futuro)
1. Vincular transações a matrículas automaticamente
2. Checkout próprio
3. Relatórios avançados

## Open Questions

1. **Reembolsos**: Como tratar? Criar transação negativa ou atualizar status?
   - *Proposta*: Atualizar status para 'refunded' e manter histórico

2. **Múltiplas empresas na Hotmart**: Cliente pode ter mais de uma conta?
   - *Proposta*: Campo `provider_account_id` opcional na tabela `payment_providers`

3. **Histórico de preços**: Manter quando produto muda de preço?
   - *Proposta*: Transação grava `amount_cents` no momento da compra (snapshot)
