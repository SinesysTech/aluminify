# Change: Add Financial/Commercial Module

## Why

O sistema precisa de um módulo financeiro flexível para:
1. **Rastrear transações de vendas** - histórico completo de compras dos alunos
2. **Suportar múltiplas origens de checkout** - Hotmart, checkout próprio do sistema, ou integrações futuras
3. **Fornecer dados comerciais** - relatórios de vendas, cupons, conversões
4. **Preparar para checkout próprio** - estrutura que permita implementação futura de checkout nativo

O cliente deve ter liberdade de escolher entre usar integração com Hotmart ou o checkout do próprio sistema.

## What Changes

### Database
- **ADDED** Tabela `transactions` - registro de todas as transações/vendas
- **ADDED** Tabela `products` - produtos/ofertas disponíveis para venda
- **ADDED** Tabela `coupons` - cupons de desconto
- **ADDED** Tabela `payment_providers` - configuração de provedores (Hotmart, Stripe, etc.)
- **MODIFIED** Tabela `alunos` - campos Hotmart já adicionados (cidade, estado, hotmart_id, etc.)

### Backend
- **ADDED** Service `financial` - lógica de negócio do módulo financeiro
- **ADDED** Repository `transaction` - acesso a dados de transações
- **ADDED** API routes `/api/financial/*` - endpoints para dados financeiros
- **ADDED** Webhook handler para Hotmart - receber notificações de vendas

### Frontend
- **ADDED** Página `/admin/financeiro` - dashboard financeiro
- **ADDED** Página `/admin/financeiro/transacoes` - listagem de transações
- **ADDED** Página `/admin/financeiro/produtos` - gestão de produtos
- **ADDED** Página `/admin/financeiro/cupons` - gestão de cupons
- **ADDED** Componentes de relatórios - gráficos e métricas

## Impact

- **Affected specs**: Nenhum spec existente afetado (novo módulo)
- **Affected code**:
  - `backend/services/` - novo service financial
  - `app/api/` - novas rotas de API
  - `app/(dashboard)/admin/` - novas páginas
  - `supabase/migrations/` - novas tabelas
- **Breaking changes**: Nenhum

## Dependencies

- Migration de campos Hotmart na tabela `alunos` (já aplicada)
- Multi-tenancy via `empresa_id` (já implementado)

## Success Criteria

1. Transações da Hotmart podem ser importadas e visualizadas
2. Sistema preparado para checkout próprio futuro
3. Relatórios financeiros básicos disponíveis
4. Webhook da Hotmart funcionando para novas vendas
