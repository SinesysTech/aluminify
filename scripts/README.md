# Scripts Aluminify

Este diretório contém os scripts de utilidade e automação do sistema Aluminify, organizados por módulos e categorias.

## Estrutura de Pastas

A organização reflete os módulos existentes no sistema ou categorias gerais de infraestrutura e manutenção.

### Módulos do Sistema

#### 1. Agendamentos (`scripts/agendamentos/`)
- `migrate-agendamentos.ts`: Migra dados de disponibilidade para o novo sistema de recorrência.

#### 2. Usuários (`scripts/usuario/`)
- `verify-user.ts`: Verifica a existência e os dados de um usuário pelo email.

#### 3. Financeiro (`scripts/integracoes/financeiro/`)
- `import-hotmart-transactions.ts`: Importa transações da Hotmart.
- `fix-transaction-products.ts`: Corrige mapeamento de produtos em transações existentes.
- `repair-hotmart-missing-enrollments.ts`: Reprocessa matrículas faltantes de compras Hotmart aprovadas (quando o mapeamento de IDs do curso foi configurado depois).

#### 4. Administrador (`scripts/admin/`)
- `delete-all-students.sql`: Script SQL para limpeza completa de dados de alunos (Uso restrito).

### Integrações (`scripts/integracoes/`)

- **Alunos** (`alunos/`): `import-hotmart-alunos.ts` (Importação principal).
- **Data** (`data/`): Arquivos JSON de entrada e relatórios de saída.
- **Utils** (`utils/`): Scripts de suporte para leitura de Excel e execução de processos em lote.

### 5-Geral (`scripts/5-geral/`)

#### Infraestrutura (`infra/`)
- Scripts relacionados a Docker (`docker-build`, `docker-run`), variáveis de ambiente (`validate-env`, `check-environment`) e extensões do VSCode.

#### Banco de Dados (`database/`)
- `check-empty-tables-v2.js`: Verifica o estado das tabelas no Supabase.
- `fix-supabase-types.ps1`: Automação para correção de tipos gerados.
- `repair_migrations.ps1`: Utilitário para reparo de histórico de migrações.

#### MCP (`mcp/`)
- Setup e validação de Model Context Protocol para integração com Supabase e Shadcn.

#### Design (`design/`)
- `check-status-colors.mjs`: Auditoria de consistência de cores no sistema.
- `color-audit.mjs`: Análise detalhada de paletas CSS.

#### Refatoração (`refactor/`)
- Utilitários para limpeza de imports do React e correção de locks do Next.js.

#### Testes (`test/`)
- Scripts de validação de funcionalidades específicas como callbacks de chat.

---

## Como Executar

A maioria dos scripts TypeScript pode ser executada via `npx tsx`:

```bash
npx tsx scripts/modulo/script-name.ts
```

Certifique-se de ter o arquivo `.env.local` configurado com as credenciais do Supabase.
