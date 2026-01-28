# Revisao de Implementacao - CopilotKit e Mastra AI

**Data:** 2026-01-28
**Versao:** 3.0
**Status:** Implementacao Completa com AG-UI

---

## 1. Resumo Executivo

Este documento descreve a integracao do CopilotKit e Mastra AI ao Aluminify usando o protocolo AG-UI oficial.

### Relacao CopilotKit + Mastra

**CopilotKit NAO e uma alternativa ao Mastra** - eles trabalham juntos:

- **CopilotKit** = Agentic Application Platform (UI, providers, runtime, streaming)
- **Mastra** = Agent Framework (uma das opcoes dentro do CopilotKit)
- **AG-UI Protocol** = Protocolo que conecta frameworks de agentes ao CopilotKit
- **@ag-ui/mastra** = Pacote oficial para integrar Mastra com CopilotKit

### Escopo Implementado

1. **CopilotKit** como plataforma de UI e runtime
2. **Dois modos de operacao via mesmo endpoint:**
   - `copilotkit`: Direct-to-LLM com backend actions
   - `mastra`: Mastra agent framework via AG-UI protocol
3. **Arquitetura multi-tenant** com tabela `ai_agents`
4. **Integracao oficial** usando `MastraAgent.getLocalAgents()`

---

## 2. Arquitetura Implementada

### 2.1 Diagrama Unificado

```
+------------------+
|   Frontend UI    |
|  CopilotChat     |
+--------+---------+
         |
         | Header: X-CopilotKit-Agent
         v
+------------------------+
|   /api/copilotkit      |
|                        |
|  if agent == 'mastra': |
|    +----------------+  |
|    | MastraAgent    |  |
|    | .getLocalAgents|  |
|    | (AG-UI)        |  |
|    | EmptyAdapter   |  |
|    +----------------+  |
|  else:                 |
|    +----------------+  |
|    | CopilotKit     |  |
|    | Actions        |  |
|    | OpenAIAdapter  |  |
|    +----------------+  |
+------------------------+
```

### 2.2 Modos de Operacao

| Modo | Adapter | Header | Uso |
|------|---------|--------|-----|
| `copilotkit` | OpenAIAdapter | (nenhum) | Actions simples |
| `mastra` | ExperimentalEmptyAdapter | `X-CopilotKit-Agent: mastra` | Agentes com estado/memoria |

---

## 3. Implementacao

### 3.1 API Route (`/api/copilotkit/route.ts`)

```typescript
import { MastraAgent } from "@ag-ui/mastra";
import { CopilotRuntime, ExperimentalEmptyAdapter } from "@copilotkit/runtime";

// Modo Mastra
const mastra = createMastraWithContext(userContext, agentConfig);
const runtime = new CopilotRuntime({
  agents: MastraAgent.getLocalAgents({ mastra }),
});
const serviceAdapter = new ExperimentalEmptyAdapter();

// Modo CopilotKit (direct-to-LLM)
const runtime = new CopilotRuntime({ actions });
const serviceAdapter = new OpenAIAdapter({ openai, model });
```

### 3.2 Provider (`copilotkit-provider.tsx`)

```typescript
interface CopilotKitProviderProps {
  user: AppUser;
  children: React.ReactNode;
  agentMode?: 'copilotkit' | 'mastra';
}

// Adiciona header para modo Mastra
if (agentMode === 'mastra') {
  headers['X-CopilotKit-Agent'] = 'mastra';
}
```

### 3.3 Uso no Frontend

```tsx
// Modo CopilotKit (default)
<CopilotKitProvider user={user}>
  <CopilotChat />
</CopilotKitProvider>

// Modo Mastra
<CopilotKitProvider user={user} agentMode="mastra">
  <CopilotChat />
</CopilotKitProvider>
```

---

## 4. Arquivos Principais

| Arquivo | Descricao |
|---------|-----------|
| `/app/api/copilotkit/route.ts` | Endpoint unificado (ambos os modos) |
| `/app/shared/lib/copilotkit/actions.ts` | Backend actions |
| `/app/shared/lib/mastra/index.ts` | Factory functions Mastra |
| `/app/shared/lib/mastra/agents/study-assistant.ts` | Agente de estudos |
| `/app/shared/lib/mastra/tools/index.ts` | Tools do agente |
| `/app/shared/components/providers/copilotkit-provider.tsx` | Provider com agentMode |

---

## 5. Backend Actions / Tools

Ambos os modos compartilham a mesma logica de negocio:

| Action/Tool | Descricao | Permissao |
|-------------|-----------|-----------|
| `getServerTime` | Data/hora do servidor | Todos |
| `searchCourses` | Busca cursos | Todos (filtrado por empresa) |
| `getStudentProgress` | Progresso do aluno | Aluno (proprio) ou Admin |
| `searchStudents` | Busca alunos | Apenas Admin |

---

## 6. Tabela ai_agents

```sql
ai_agents (
  id uuid PRIMARY KEY,
  empresa_id uuid NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  integration_type text,  -- 'copilotkit' | 'mastra' | 'n8n' | 'custom'
  integration_config jsonb,
  system_prompt text,
  model text DEFAULT 'gpt-4o-mini',
  temperature numeric DEFAULT 0.7,
  is_default boolean,
  is_active boolean,
  -- ... outros campos
)
```

O `integration_type` determina qual modo usar no frontend.

---

## 7. Dependencias

```json
{
  "@copilotkit/react-core": "^1.51.2",
  "@copilotkit/react-ui": "^1.51.2",
  "@copilotkit/runtime": "^1.51.2",
  "@ag-ui/mastra": "^0.2.0",
  "@ag-ui/client": "^0.0.43",
  "@ag-ui/core": "^0.0.43",
  "@mastra/core": "^1.0.4",
  "@ai-sdk/openai": "^3.0.21"
}
```

---

## 8. Endpoints Legados

Os endpoints `/api/mastra/*` podem ser removidos ou mantidos para compatibilidade:

| Endpoint | Status | Recomendacao |
|----------|--------|--------------|
| `/api/mastra` | Legado | Usar `/api/copilotkit?agent=mastra` |
| `/api/mastra/stream` | Legado | CopilotKit ja faz streaming nativo |

---

## 9. Proximos Passos

### 9.1 Concluido
- [x] Instalar @ag-ui/mastra
- [x] Implementar integracao AG-UI oficial
- [x] Atualizar /api/copilotkit para suportar ambos os modos
- [x] Atualizar CopilotKitProvider com agentMode
- [x] Documentar arquitetura

### 9.2 Curto Prazo
- [ ] Atualizar pagina do agente para ler integration_type da config
- [ ] Testar fluxo completo com tenant CDF
- [ ] Criar interface admin para gerenciar ai_agents

### 9.3 Medio Prazo
- [ ] Implementar Human-in-the-Loop com Mastra
- [ ] Adicionar Generative UI para mostrar progresso
- [ ] Implementar Shared State entre frontend e agente
- [ ] Remover endpoints /api/mastra/* legados

---

## 10. Referencias

### Documentacao Oficial
- [CopilotKit Docs](https://docs.copilotkit.ai)
- [CopilotKit + Mastra Quickstart](https://docs.copilotkit.ai/integrations/mastra/quickstart)
- [AG-UI Protocol](https://docs.copilotkit.ai/ag-ui-protocol)

### Repositorio de Referencia
- [CopilotKit/with-mastra](https://github.com/CopilotKit/with-mastra)

---

## 11. Conclusao

A implementacao esta completa e segue o padrao oficial do CopilotKit:

1. **CopilotKit e a plataforma** - fornece UI, providers, runtime
2. **Mastra e o framework de agentes** - uma das opcoes dentro do CopilotKit
3. **AG-UI Protocol** - conecta Mastra ao CopilotKit via `@ag-ui/mastra`
4. **Um unico endpoint** - `/api/copilotkit` suporta ambos os modos
5. **`MastraAgent.getLocalAgents()`** - forma oficial de registrar agentes

A arquitetura permite escolher entre direct-to-LLM (actions) ou agent framework (Mastra) atraves do `agentMode` prop no Provider.
