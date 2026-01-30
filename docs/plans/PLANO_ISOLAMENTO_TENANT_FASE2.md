# Plano de Implementação — Isolamento por Tenant (Fase 2)

**Data:** 2026-01-30  
**Status:** Implementado  
**Contexto:** Após correções iniciais, persistem vazamentos de dados ao trocar de organização (ex: CDF → Terra Negra).

---

## Problemas Identificados

### 1. Dashboard — Tempo de estudo, Flashcards, Eficiência e Foco

**Fontes de vazamento:**
- `getFocusTime()` → `getStudyTimeSecondsForPeriod()` → `getListSessionsRows()` e `getWatchedClassesRows()`: **não filtram por empresa_id**
- `getFlashcardsReviewed()`: consulta `progresso_flashcards` **sem filtro empresa_id**
- `getFocusEfficiency()`: consulta `sessoes_estudo` **sem filtro empresa_id**
- `getScheduleProgress()`: usa `getLatestCronogramaId()` que **não filtra por empresa_id**
- `getHeatmapData()`: `getListSessionsHeatmapRows()` e `getWatchedClassesHeatmapRows()` **não filtram por empresa_id**

**Arquivo:** `app/[tenant]/(modules)/dashboard/services/dashboard-analytics.service.ts`

---

### 2. Sidebar — Módulos não atualizam ao trocar tenant

**Causa provável:**
- `ModuleVisibilityProvider` usa `empresaIdProp ?? tenantContext?.empresaId`
- Se `empresaIdProp` (do layout via headers) vier preenchido com valor antigo (ex: CDF), o `tenantContext` nunca é usado
- O layout pode estar em cache ou não re-renderizar com os novos headers após navegação client-side

**Solução:** Sempre priorizar `tenantContext?.empresaId` quando disponível, em vez de depender do prop do layout.

**Arquivo:** `app/shared/components/providers/module-visibility-provider.tsx`

---

### 3. Cronograma — Exibe cronograma da organização errada

**Problema:**
- Páginas `cronograma/(aluno)/page.tsx` e `cronograma/calendario/page.tsx` buscam o cronograma com:
  ```ts
  .eq('usuario_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  ```
- **Não há filtro por `empresa_id`** → retorna o cronograma mais recente, independente da organização ativa

**Arquivos:**
- `app/[tenant]/(modules)/cronograma/(aluno)/page.tsx`
- `app/[tenant]/(modules)/cronograma/calendario/page.tsx`

**Solução:** Resolver `empresaId` do tenant ativo (slug da URL) e adicionar `.eq('empresa_id', empresaId)` na query.

---

### 4. Calendário — Mesmos dados do cronograma

O calendário usa a mesma lógica da página de cronograma (ScheduleCalendarView com cronogramaId). O `cronogramaId` vem da página `calendario/page.tsx`, que tem o mesmo problema descrito no item 3.

**Arquivo:** `app/[tenant]/(modules)/cronograma/calendario/page.tsx`

---

### 5. Agendamentos (Calendário de mentoria)

**Problema:**
- `getAgendamentosAluno()` em `appointment-actions.ts` busca agendamentos **sem filtro empresa_id**
- Para alunos multi-org, pode retornar agendamentos de todas as organizações

**Arquivo:** `app/[tenant]/(modules)/agendamentos/lib/appointment-actions.ts`

**Solução:** Receber `empresaId` opcional e filtrar `.eq('empresa_id', empresaId)` quando fornecido. A página `agendamentos/meus/page.tsx` precisa obter o `empresaId` do tenant ativo e passar para a action.

---

## Plano de Implementação

### Fase 1 — Dashboard Analytics (Prioridade P0)

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|----------|
| 1.1 | Passar `empresaId` para `getMetrics` e propagar | dashboard-analytics.service.ts | Já recebe; garantir que `getFocusTime`, `getFlashcardsReviewed`, `getScheduleProgress` recebam e usem |
| 1.2 | `getFocusTime` | idem | Passar `empresaId` para `getStudyTimeSecondsForPeriod`; este deve passar para `getListSessionsRows` e `getWatchedClassesRows` |
| 1.3 | `getStudyTimeSecondsForPeriod` | idem | Adicionar parâmetro `empresaId`; repassar para `getListSessionsRows` e `getWatchedClassesRows` |
| 1.4 | `getListSessionsRows` | idem | Filtro `.eq("empresa_id", empresaId)` em `sessoes_estudo` |
| 1.5 | `getWatchedClassesRows` | idem | Usar `getLatestCronogramaId(alunoId, client, empresaId)` |
| 1.6 | `getLatestCronogramaId` | idem | Adicionar parâmetro `empresaId`; filtro `.eq("empresa_id", empresaId)` |
| 1.7 | `getFlashcardsReviewed` | idem | Adicionar parâmetro `empresaId`; filtro `.eq("empresa_id", empresaId)` em `progresso_flashcards` |
| 1.8 | `getFocusEfficiency` | idem | Adicionar parâmetro `empresaId`; filtro `.eq("empresa_id", empresaId)` em `sessoes_estudo` |
| 1.9 | `getScheduleProgress` | idem | Usar `getLatestCronogramaId` com `empresaId` |
| 1.10 | `getHeatmapData` | idem | Passar `empresaId` para `getListSessionsHeatmapRows` e `getWatchedClassesHeatmapRows`; ambas devem filtrar por `empresa_id` |
| 1.11 | Helpers de heatmap | idem | `getListSessionsHeatmapRows`, `getWatchedClassesHeatmapRows` recebem `empresaId` e aplicam filtro |

---

### Fase 2 — Sidebar e Visibilidade de Módulos (Prioridade P0)

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|----------|
| 2.1 | Priorizar tenantContext sobre layout | module-visibility-provider.tsx | Alterar para `empresaId = tenantContext?.empresaId ?? empresaIdProp ?? null` |
| 2.2 | Forçar refetch ao mudar tenant | idem | Garantir que `useEffect` dependa de `empresaId` e faça refetch ao alterar |
| 2.3 | Adicionar x-tenant-id ao fetch | idem | Na chamada `fetch(/api/empresa/module-visibility/${empresaId})`, incluir header `x-tenant-id` com o `empresaId` para a API usar o tenant correto |

---

### Fase 3 — Cronograma e Calendário (Prioridade P0)

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|----------|
| 3.1 | Filtrar cronograma por empresa | cronograma/(aluno)/page.tsx | Obter `empresaId` do tenant (headers ou DB por slug); adicionar `.eq('empresa_id', empresaId)` na query |
| 3.2 | Filtrar cronograma por empresa | cronograma/calendario/page.tsx | Mesma alteração da 3.1 |
| 3.3 | Fallback quando não houver cronograma | ambos | Se não houver cronograma para o tenant ativo, redirecionar para `/cronograma/novo` ou exibir mensagem adequada |

**Nota:** As páginas são Server Components. Obter `empresaId` via `headers().get('x-tenant-id')` ou via `resolveTenantId(tenant)` com o slug da URL.

---

### Fase 4 — Agendamentos / Meus Agendamentos (Prioridade P1)

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|----------|
| 4.1 | Filtrar getAgendamentosAluno por empresa | appointment-actions.ts | Adicionar parâmetro opcional `empresaId`; quando presente, `.eq('empresa_id', empresaId)` |
| 4.2 | Passar empresaId na página | agendamentos/meus/page.tsx | Obter `empresaId` do tenant (headers ou slug) e passar para `getAgendamentosAluno(user.id, empresaId)` |

---

### Fase 5 — API Client e Header x-tenant-id (Prioridade P1)

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|----------|
| 5.1 | Passar tenantId em chamadas críticas | dashboard.service.ts, etc. | Ao usar `apiClient.get()`, passar `{ tenantId: tenantContext?.empresaId }` para garantir que a API receba o header correto |
| 5.2 | Revisar fluxo Referer | middleware | Confirmar que requisições de API vindas de páginas tenant (ex: /terra-negra/dashboard) recebem `x-tenant-id` via Referer quando aplicável |

---

## Ordem de Execução Sugerida

1. **Fase 2** (Sidebar) — impacto imediato na UX
2. **Fase 3** (Cronograma/Calendário) — vazamento de dados sensíveis
3. **Fase 1** (Dashboard Analytics) — mais alterações, mas bem delimitadas
4. **Fase 4** (Agendamentos)
5. **Fase 5** (API Client) — camada de reforço

---

## Riscos e Considerações

- **Cronograma:** Aluno pode não ter cronograma para o tenant ativo; tratar com redirect para criação ou mensagem clara.
- **Dashboard:** Métodos privados compartilham assinaturas; cuidado com retrocompatibilidade em chamadas internas.
- **Sidebar:** `tenantContext` pode ser `null` em páginas sem TenantContextProvider; manter fallback para `empresaIdProp`.

---

## Critérios de Aceite

- [ ] Ao trocar para Terra Negra, a sidebar mostra apenas módulos habilitados para Terra Negra (sem Assistente/Flashcards se desabilitados).
- [ ] Tempo de estudo, Flashcards revisados e Eficiência/Foco no dashboard refletem apenas dados da organização ativa.
- [ ] Cronograma e Calendário exibem apenas o cronograma da organização ativa.
- [ ] Meus Agendamentos exibe apenas agendamentos da organização ativa.
- [ ] Nenhum dado de outra organização é exibido após o switch.
