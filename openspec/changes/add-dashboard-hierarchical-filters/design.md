## Context
O dashboard atual agrega dados em `/api/dashboard/analytics` e renderiza cards fixos. As métricas já usam `sessoes_estudo` (tempo) e `progresso_atividades`/`progresso_flashcards` (performance), mas faltam filtros por níveis do conteúdo.

Restrições observadas:
- `public.sessoes_estudo` **não** tem `modulo_id`, o que limita “tempo por módulo”.
- A estrutura de conteúdo é curso → disciplina → frente → módulo (com alguns itens globais via `curso_id = null`).

## Goals / Non-Goals
- Goals:
  - Permitir filtros hierárquicos: Curso→Disciplina→Frente→Módulo.
  - Manter carregamento inicial do dashboard rápido.
  - Suportar “tempo por módulo” de forma incremental (aproximado e melhorando com `modulo_id`).
- Non-Goals:
  - Não redesenhar o dashboard inteiro.
  - Não criar um data warehouse/ETL neste change.

## Decisions
- **Endpoints por card**: criar rotas específicas para dados filtráveis (evita inflar `/api/dashboard/analytics` e reduz recomputações).
- **Persistir `modulo_id` em sessões**: adicionar coluna em `sessoes_estudo` e preencher na criação; fazer backfill quando houver `atividade_relacionada_id`.
- **Domínio Estratégico sem “Modo”**: manter os eixos Flashcards/Questões juntos; o filtro é por escopo e por módulo (com seletor + ranking).

## Risks / Trade-offs
- Sessões antigas podem não ter módulo (ficam em “Não identificado”).
- Algumas agregações exigem joins em lote; cuidado com limites de `IN` e N+1 (chunking quando necessário).

## Migration Plan
1. Migração SQL adiciona `sessoes_estudo.modulo_id` + índice.
2. Backfill via `atividade_relacionada_id → atividades.modulo_id`.
3. Atualizar a rota de iniciar sessão para aceitar/derivar `modulo_id`.
4. Deploy do backend e frontend.

## Rollback
- Manter endpoints novos opcionais (UI pode cair para comportamento atual).
- A coluna `modulo_id` pode permanecer mesmo em rollback (não quebra o app).

