## Context

A página Sala de Estudos (`client.tsx`) exibe um contador de streak (dias consecutivos de estudo) com valor fixo `0` via `useState(0)`. O serviço `DashboardAnalyticsService` já calcula streak real através do método `calculateStreak()`, que consulta sessões concluídas na tabela `sessoes_estudo`. O endpoint `GET /api/dashboard/user` já retorna `UserInfo.streakDays`. O componente `ProgressoStatsCard` já renderiza streak com ícone animado e mensagens contextuais — só falta alimentá-lo com dados reais.

## Goals / Non-Goals

**Goals:**
- Substituir o `useState(0)` hardcoded por dados reais do endpoint `/api/dashboard/user`
- Tratar estados de loading e erro na exibição do streak
- Manter consistência com o padrão de data fetching do projeto (TanStack Query)

**Non-Goals:**
- Alterar o serviço `DashboardAnalyticsService` ou o endpoint existente
- Modificar a UI do `ProgressoStatsCard` (já está pronta)
- Criar endpoint dedicado para streak (o endpoint de user já fornece o dado)
- Implementar cache no servidor ou otimizações de performance

## Decisions

### D1: Usar TanStack Query para fetch do streak

**Escolha:** Criar um hook com `useQuery` que chama `GET /api/dashboard/user` e extrai `streakDays` da resposta.

**Alternativas consideradas:**
- `useEffect` + `fetch` manual: Funcionaria, mas não fornece cache, deduplicação e retry automáticos. Inconsistente com o padrão do projeto.
- Server Component com fetch: `client.tsx` já é um Client Component (`"use client"`), e o streak precisa de reatividade. Refatorar para Server Component está fora de escopo.

**Rationale:** O projeto já usa TanStack Query v5 como padrão para server state. O hook permite reutilização futura e tratamento padronizado de loading/error.

### D2: Reutilizar endpoint `/api/dashboard/user` existente

**Escolha:** Consumir `GET /api/dashboard/user` que já retorna `{ data: UserInfo }` com `streakDays`.

**Alternativas consideradas:**
- Criar endpoint dedicado `/api/sala-de-estudos/streak`: Over-engineering. O dado já existe e o endpoint é leve (uma query de sessões + metadata de user).

**Rationale:** Evita duplicação de lógica e endpoints. O endpoint já trata autenticação e autorização.

### D3: Hook dedicado no módulo sala-de-estudos

**Escolha:** Criar `useStreakDays()` em `sala-de-estudos/hooks/` (ou similar) que encapsula a query e retorna `{ streakDays, isLoading, isError }`.

**Rationale:** Encapsula a lógica de fetch e extração do campo, mantendo `client.tsx` limpo. Se futuramente o source do streak mudar, só o hook precisa ser alterado.

## Risks / Trade-offs

- **[Latência da requisição]** → O endpoint `/api/dashboard/user` faz uma query ao banco. Mitigação: TanStack Query fornece `staleTime` para cache client-side, e a query de streak é leve (últimas 365 sessões com LIMIT).
- **[Dependência cross-módulo]** → Sala de Estudos passa a depender de um endpoint do módulo Dashboard. Mitigação: Acoplamento é apenas via HTTP — se o endpoint mudar, só o hook precisa ser atualizado. Aceitável dado que ambos são módulos do mesmo sistema.
