# Revisao de Implementacao - CopilotKit e Mastra AI

**Data:** 2026-01-28
**Versao:** 5.0
**Status:** Implementacao Completa com AG-UI e Configuracao Dinamica de Agentes

---

## 1. Resumo Executivo

Este documento descreve a integracao do CopilotKit e Mastra AI ao Aluminify usando o protocolo AG-UI oficial, com comparacao completa a documentacao oficial.

### Relacao CopilotKit + Mastra

**CopilotKit NAO e uma alternativa ao Mastra** - eles trabalham juntos:

- **CopilotKit** = Agentic Application Platform (UI, providers, runtime)
- **Mastra** = Agent Framework (uma das opcoes dentro do CopilotKit)
- **AG-UI Protocol** = Protocolo universal que conecta frameworks de agentes ao CopilotKit
- **@ag-ui/mastra** = Pacote oficial para integrar Mastra com CopilotKit

### Frameworks Suportados via AG-UI

CopilotKit suporta multiplos frameworks via AG-UI Protocol:
- Mastra
- LangGraph
- CrewAI (Crews e Flows)
- AG2 (Microsoft AutoGen)
- Agno
- LlamaIndex
- Pydantic AI
- ADK (Google)
- A2A Protocol

---

## 2. Status da Implementacao

### 2.1 Implementado (Seguindo Documentacao Oficial)

| Feature | Status | Referencia Oficial |
|---------|--------|-------------------|
| CopilotKit Runtime | ✅ | [Quickstart](https://docs.copilotkit.ai/direct-to-llm/guides/quickstart) |
| CopilotKitProvider | ✅ | Frontend integration |
| CopilotChat | ✅ | [Agentic Chat UI](https://docs.copilotkit.ai/agentic-chat-ui) |
| Backend Actions | ✅ | [Backend Actions](https://docs.copilotkit.ai/backend-actions) |
| Mastra AG-UI Integration | ✅ | [Mastra Quickstart](https://docs.copilotkit.ai/mastra/quickstart) |
| MastraAgent.getLocalAgents() | ✅ | Official pattern |
| ExperimentalEmptyAdapter | ✅ | For agent frameworks |
| Multi-tenant Context | ✅ | Custom implementation |
| Dual Mode (copilotkit/mastra) | ✅ | Custom architecture |
| **Dynamic Agent Config** | ✅ | **Configuracao do agente via banco de dados** |
| **Database-driven System Prompt** | ✅ | **System prompt configuravel sem redeploy** |

### 2.2 NAO Implementado

| Feature | Status | Referencia Oficial | Prioridade |
|---------|--------|-------------------|------------|
| Mastra Studio | ❌ | [Studio Docs](https://mastra.ai/docs/getting-started/studio) | Media |
| CopilotSidebar | ❌ | @copilotkit/react-ui | Baixa |
| CopilotPopup | ❌ | @copilotkit/react-ui | Baixa |
| Human-in-the-Loop | ❌ | [HITL Docs](https://docs.copilotkit.ai/mastra/human-in-the-loop) | Alta |
| Generative UI | ❌ | [Generative UI](https://docs.copilotkit.ai/mastra/generative-ui) | Media |
| Shared State | ❌ | [Shared State](https://docs.copilotkit.ai/shared-state) | Media |
| Agent Memory | ❌ | @mastra/memory | Media |
| Threads/Persistence | ❌ | [Persistence](https://docs.copilotkit.ai/langgraph/persistence/message-persistence) | Baixa |
| Frontend Actions/Tools | ❌ | [Frontend Actions](https://docs.copilotkit.ai/mastra/frontend-actions) | Media |

---

## 3. Versoes dos Pacotes

### 3.1 Instalados (package.json)

```json
{
  "@copilotkit/react-core": "^1.51.2",
  "@copilotkit/react-ui": "^1.51.2",
  "@copilotkit/runtime": "^1.51.2",
  "@ag-ui/mastra": "^0.2.0",
  "@ag-ui/client": "^0.0.43",
  "@ag-ui/core": "^0.0.43",
  "@mastra/core": "^0.24.9",
  "@ai-sdk/openai": "^3.0.21"
}
```

### 3.2 Verificacao de Versoes (2026-01-28)

| Pacote | Instalado | Ultima Disponivel | Status |
|--------|-----------|-------------------|--------|
| @copilotkit/runtime | ^1.51.2 | ~1.51.x | ✅ Atualizado |
| @copilotkit/react-core | ^1.51.2 | 1.51.2 | ✅ Atualizado |
| @copilotkit/react-ui | ^1.51.2 | 1.51.2 | ✅ Atualizado |
| @mastra/core | ^0.24.9 | 0.24.x | ⚠️ Pinned (compatibilidade @ag-ui/mastra) |
| @ag-ui/mastra | ^0.2.0 | 0.2.0 | ✅ Atualizado |
| @ag-ui/client | ^0.0.43 | 0.0.43 | ✅ Atualizado |
| @ag-ui/core | ^0.0.43 | 0.0.43 | ✅ Atualizado |

**Nota sobre @mastra/core**: Versao 0.24.9 e usada para compatibilidade com @ag-ui/mastra.
O @ag-ui/mastra@0.2.0 depende de `@mastra/core/runtime-context` que foi renomeado para
`request-context` na versao 1.0.x.

---

## 4. Arquitetura Implementada

### 4.1 Diagrama de Fluxo (com Configuracao Dinamica)

```
+------------------+
|   Frontend UI    |
|  CopilotChat     |
+--------+---------+
         |
         | Headers: Authorization, X-CopilotKit-Agent-Slug
         v
+------------------------------------------+
|          /api/copilotkit                 |
|                                          |
|  1. Autenticacao (Bearer token)          |
|  2. Busca config do agente no Supabase   |
|     +----------------------------------+ |
|     |  ai_agents table                 | |
|     |  - system_prompt                 | |
|     |  - model                         | |
|     |  - temperature                   | |
|     |  - integration_type              | |
|     +----------------------------------+ |
|                                          |
|  3. Se integration_type == 'mastra':     |
|     +----------------+                   |
|     | MastraAgent    | <- config dinamica|
|     | EmptyAdapter   |                   |
|     +----------------+                   |
|     Se integration_type == 'copilotkit': |
|     +----------------+                   |
|     | CopilotKit     |                   |
|     | Actions        | <- config dinamica|
|     | OpenAIAdapter  |                   |
|     +----------------+                   |
+------------------------------------------+
```

### 4.2 Modos de Operacao

| Modo | Adapter | Determinado Por | Uso |
|------|---------|-----------------|-----|
| `copilotkit` | OpenAIAdapter | `ai_agents.integration_type = 'copilotkit'` | Actions simples, direct-to-LLM |
| `mastra` | ExperimentalEmptyAdapter | `ai_agents.integration_type = 'mastra'` | Agentes com estado/memoria |

### 4.3 Configuracao Dinamica de Agentes

A configuracao do agente e carregada do banco de dados em tempo de execucao:

```typescript
// 1. Frontend envia o slug do agente (opcional)
headers: {
  'X-CopilotKit-Agent-Slug': 'study-assistant' // opcional
}

// 2. API busca config no banco
const agentConfig = await repository.getChatConfig(empresaId, agentSlug);

// 3. Config inclui:
{
  id: string;
  slug: string;
  name: string;
  systemPrompt: string | null;  // System prompt configuravel
  model: string;                 // Modelo LLM (gpt-4o-mini, etc)
  temperature: number;           // Temperatura do modelo
  integrationType: 'copilotkit' | 'mastra';  // Determina o modo
  integrationConfig: object;     // Config especifica da integracao
}

// 4. Agente e criado com a config do banco
createMastraWithContext(userContext, {
  agentId: config.slug,
  agentName: config.name,
  systemPrompt: config.systemPrompt,
  model: config.model,
  temperature: config.temperature,
});
```

### 4.4 Fallback (Quando nao ha config no banco)

Se nao houver agente configurado no banco, um DEFAULT_AGENT_CONFIG e usado:

```typescript
const DEFAULT_AGENT_CONFIG = {
  slug: "study-assistant",
  name: "Assistente de Estudos",
  model: "gpt-4o-mini",
  temperature: 0.7,
  integrationType: "copilotkit",
  systemPrompt: null,  // Usa o prompt default do agent
};
```

---

## 5. Comparacao com Documentacao Oficial

### 5.1 API Route - Nossa Implementacao vs Oficial

**Oficial (CopilotKit + Mastra):**
```typescript
import { CopilotRuntime, ExperimentalEmptyAdapter } from "@copilotkit/runtime";
import { MastraAgent } from "@ag-ui/mastra";
import { mastra } from "@/mastra";

const runtime = new CopilotRuntime({
  agents: MastraAgent.getLocalAgents({ mastra }),
});
const serviceAdapter = new ExperimentalEmptyAdapter();
```

**Nossa Implementacao (`/api/copilotkit/route.ts`):**
```typescript
// Mastra mode - IGUAL ao oficial
const mastra = createMastraWithContext(userContext, agentConfig);
copilotRuntime = new CopilotRuntime({
  // @ts-expect-error - AG-UI integration type compatibility
  agents: MastraAgent.getLocalAgents({ mastra }),
});
serviceAdapter = emptyAdapter;

// CopilotKit mode - adicional (direct-to-LLM)
copilotRuntime = new CopilotRuntime({ actions });
serviceAdapter = openAIAdapter;
```

**Diferenca:** Nossa implementacao adiciona suporte dual-mode com header para escolher entre CopilotKit actions e Mastra agents.

### 5.2 Mastra Agent - Nossa Implementacao vs Oficial

**Oficial (CopilotKit/with-mastra):**
```typescript
export const weatherAgent = new Agent({
  id: "weather-agent",
  name: "Weather Agent",
  tools: { weatherTool },
  model: openai("gpt-4o"),
  instructions: "You are a helpful assistant.",
});
```

**Nossa Implementacao (`study-assistant.ts`):**
```typescript
const agent = new Agent({
  id: agentId,           // Configuravel
  name: agentName,       // Configuravel
  instructions: systemPrompt, // Configuravel
  model: openai(model),  // Configuravel (default: gpt-4o-mini)
  tools,                 // Tools com contexto multi-tenant
});
```

**Diferenca:** Nossa implementacao e mais flexivel com configuracao dinamica e injecao de contexto multi-tenant.

### 5.3 Provider - Nossa Implementacao vs Oficial

**Oficial:**
```tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  <CopilotSidebar>
    <YourApp />
  </CopilotSidebar>
</CopilotKit>
```

**Nossa Implementacao:**
```tsx
<CopilotKit
  runtimeUrl="/api/copilotkit"
  headers={{
    Authorization: `Bearer ${accessToken}`,
    ...(agentMode === 'mastra' && { 'X-CopilotKit-Agent': 'mastra' }),
  }}
  properties={{
    userId, empresaId, userRole, userName, agentMode,
  }}
>
  {children}
</CopilotKit>
```

**Diferenca:** Nossa implementacao adiciona autenticacao via Bearer token e propriedades de contexto multi-tenant.

---

## 6. Arquivos Principais

| Arquivo | Descricao | Conformidade |
|---------|-----------|--------------|
| `/app/api/copilotkit/route.ts` | Endpoint unificado (ambos os modos) | ✅ Segue padrao oficial |
| `/app/shared/components/providers/copilotkit-provider.tsx` | Provider com agentMode | ✅ Extende padrao oficial |
| `/app/shared/lib/copilotkit/actions.ts` | Backend actions | ✅ Segue padrao oficial |
| `/app/shared/lib/mastra/index.ts` | Factory functions Mastra | ✅ Segue padrao oficial |
| `/app/shared/lib/mastra/agents/study-assistant.ts` | Agente de estudos | ✅ Segue padrao oficial |
| `/app/shared/lib/mastra/tools/index.ts` | Tools do agente | ✅ Segue padrao oficial |

---

## 7. Backend Actions / Tools

### 7.1 CopilotKit Actions (modo `copilotkit`)

| Action | Descricao | Permissao |
|--------|-----------|-----------|
| `getServerTime` | Data/hora do servidor | Todos |
| `searchCourses` | Busca cursos | Todos (filtrado por empresa) |
| `getStudentProgress` | Progresso do aluno | Aluno (proprio) ou Admin |
| `searchStudents` | Busca alunos | Apenas Admin |

### 7.2 Mastra Tools (modo `mastra`)

| Tool | Descricao | Permissao |
|------|-----------|-----------|
| `getServerTime` | Data/hora do servidor | Todos |
| `searchCourses` | Busca cursos | Todos (filtrado por empresa) |
| `getStudentProgress` | Progresso do aluno | Aluno (proprio) ou Admin |
| `searchStudents` | Busca alunos | Apenas Admin |

**Nota:** Ambos os modos compartilham a mesma logica de negocio.

---

## 8. Tabela ai_agents (Multi-tenant)

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

## 9. Mastra Studio

### 9.1 O que e Mastra Studio?

Mastra Studio e uma interface visual de desenvolvimento que permite:
- Testar agentes interativamente
- Visualizar ferramentas e configuracoes
- Acessar API REST via Swagger UI
- Depurar workflows

### 9.2 Como Executar

```bash
# Requer o pacote 'mastra' CLI
npx mastra dev

# Ou adicionar ao package.json
{
  "scripts": {
    "mastra:dev": "mastra dev"
  }
}
```

**URLs disponveis:**
- Studio UI: http://localhost:4111/
- Swagger API: http://localhost:4111/swagger-ui

### 9.3 Status no Aluminify

**NAO IMPLEMENTADO** - Mastra Studio nao esta configurado porque:
1. O pacote `mastra` CLI nao esta instalado
2. Nao existe `mastra.config.ts`
3. A estrutura atual usa Mastra como biblioteca, nao como servidor standalone

**Para implementar**, seria necessario:
1. `npm install mastra` (CLI)
2. Criar arquivo de configuracao ou usar a estrutura existente
3. Adicionar script ao package.json

---

## 10. Proximos Passos

### 10.1 Concluido
- [x] Instalar @ag-ui/mastra
- [x] Implementar integracao AG-UI oficial
- [x] Atualizar /api/copilotkit para suportar ambos os modos
- [x] Atualizar CopilotKitProvider com agentMode
- [x] Documentar arquitetura
- [x] Verificar versoes dos pacotes
- [x] Comparar com documentacao oficial
- [x] **Implementar configuracao dinamica de agentes via banco de dados**
- [x] **Atualizar API para ler config do ai_agents table**
- [x] **System prompt dinamico (sem redeploy)**
- [x] **Model e temperature configuraveis por agente**

### 10.2 Curto Prazo
- [ ] Testar fluxo completo com tenant CDF
- [ ] Criar interface admin para gerenciar ai_agents
- [ ] Atualizar frontend para passar X-CopilotKit-Agent-Slug header

### 10.3 Medio Prazo
- [ ] Implementar Human-in-the-Loop com useHumanInTheLoop
- [ ] Adicionar Generative UI para mostrar progresso
- [ ] Implementar Shared State entre frontend e agente
- [ ] Implementar Frontend Actions/Tools

### 10.4 Baixa Prioridade
- [ ] Implementar Mastra Studio para desenvolvimento local
- [ ] Adicionar CopilotSidebar como alternativa ao CopilotChat
- [ ] Implementar persistencia de threads/conversas
- [ ] Implementar @mastra/memory para memoria de agente

---

## 11. Referencias

### Documentacao Oficial CopilotKit
- [CopilotKit Docs](https://docs.copilotkit.ai)
- [CopilotKit + Mastra Quickstart](https://docs.copilotkit.ai/mastra/quickstart)
- [AG-UI Protocol](https://docs.copilotkit.ai/ag-ui-protocol)
- [Human-in-the-Loop](https://docs.copilotkit.ai/mastra/human-in-the-loop)
- [Generative UI](https://docs.copilotkit.ai/mastra/generative-ui)
- [Frontend Actions](https://docs.copilotkit.ai/mastra/frontend-actions)
- [Shared State](https://docs.copilotkit.ai/shared-state)

### Documentacao Oficial Mastra
- [Mastra Docs](https://mastra.ai/docs)
- [Mastra Studio](https://mastra.ai/docs/getting-started/studio)
- [Mastra Installation](https://mastra.ai/docs/getting-started/installation)

### Repositorios de Referencia
- [CopilotKit/with-mastra](https://github.com/CopilotKit/with-mastra)
- [CopilotKit/CopilotKit](https://github.com/CopilotKit/CopilotKit)
- [mastra-ai/mastra](https://github.com/mastra-ai/mastra)

---

## 12. Conclusao

A implementacao esta completa e segue o padrao oficial do CopilotKit:

1. **CopilotKit e a plataforma** - fornece UI, providers, runtime
2. **Mastra e o framework de agentes** - uma das opcoes dentro do CopilotKit
3. **AG-UI Protocol** - conecta Mastra ao CopilotKit via `@ag-ui/mastra`
4. **Um unico endpoint** - `/api/copilotkit` suporta ambos os modos
5. **`MastraAgent.getLocalAgents()`** - forma oficial de registrar agentes
6. **Configuracao dinamica** - agentes configuraveis via banco de dados

### Diferenciais da Nossa Implementacao

| Aspecto | Padrao Oficial | Nossa Implementacao |
|---------|---------------|---------------------|
| Modos | Apenas um (agent ou actions) | Dual-mode via integration_type |
| Autenticacao | Nao especificado | Bearer token obrigatorio |
| Multi-tenant | Nao especificado | Context injection + empresa_id |
| System Prompt | Hardcoded | **Dinamico via ai_agents table** |
| Model/Temperature | Hardcoded | **Configuravel por agente** |
| Agent selection | Fixo | Por empresa/slug |

### Beneficios da Configuracao Dinamica

1. **Sem redeploy** - Alterar system prompt, model ou temperature sem build
2. **Multi-tenant** - Cada empresa pode ter agentes com configuracoes diferentes
3. **Flexibilidade** - Trocar entre CopilotKit actions e Mastra agents via DB
4. **Administravel** - Futura interface admin para gerenciar agentes

A arquitetura permite escolher entre direct-to-LLM (actions) ou agent framework (Mastra) atraves do campo `integration_type` na tabela `ai_agents`, mantendo compatibilidade total com os padroes oficiais.

---

## 13. Changelog Detalhado - Sessao 2026-01-28

### 13.1 Problemas Resolvidos

#### Problema 1: Incompatibilidade de Versoes @mastra/core

**Sintoma:**
```
Error: Can't resolve '@mastra/core/runtime-context'
```

**Causa:** O pacote `@ag-ui/mastra@0.2.0` depende de `@mastra/core/runtime-context`, mas na versao 1.0.x do @mastra/core esse modulo foi renomeado para `request-context`.

**Solucao:** Downgrade do @mastra/core para versao 0.24.9:
```json
"@mastra/core": "^0.24.9"  // Era ^1.0.4
```

#### Problema 2: Assinatura do Execute nos Tools

**Sintoma:**
```
Property 'searchTerm' does not exist on type 'ToolExecutionContext<...>'
```

**Causa:** Na versao 0.24.x do @mastra/core, a funcao `execute` dos tools recebe `(context, options)` onde os dados de entrada estao em `context.context`, nao diretamente como primeiro parametro.

**Solucao:** Atualizar todas as funcoes execute:
```typescript
// ANTES (incorreto para 0.24.x)
execute: async (inputData) => {
  const { searchTerm } = inputData;
}

// DEPOIS (correto para 0.24.x)
execute: async (executionContext) => {
  const { searchTerm } = executionContext.context;
}
```

**Arquivos alterados:**
- `/app/shared/lib/mastra/tools/index.ts`

#### Problema 3: Rota copilotkit-embedded Quebrada

**Sintoma:**
```
Error: Can't resolve '@/mastra'
```

**Causa:** Existia uma rota `/api/copilotkit-embedded` que tentava importar de `@/mastra`, um path que nao existe.

**Solucao:** Rota foi deletada pois era duplicada/quebrada. A rota principal `/api/copilotkit` ja suporta ambos os modos.

### 13.2 Features Implementadas

#### Feature 1: Configuracao Dinamica de Agentes

**O que foi feito:**

1. API route agora busca configuracao do agente no banco de dados
2. Usa o repository `AIAgentsRepositoryImpl.getChatConfig(empresaId, slug)`
3. Se nao encontrar config, usa DEFAULT_AGENT_CONFIG como fallback

**Codigo implementado em `/app/api/copilotkit/route.ts`:**

```typescript
// Imports adicionados
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { AIAgentsRepositoryImpl } from "@/app/shared/services/ai-agents/ai-agents.repository";
import type { AIAgentChatConfig } from "@/app/shared/services/ai-agents/ai-agents.types";

// Busca config do banco
const agentSlug = req.headers.get("X-CopilotKit-Agent-Slug") || undefined;

if (user.empresaId) {
  const db = getDatabaseClient();
  const repository = new AIAgentsRepositoryImpl(db);
  agentConfig = await repository.getChatConfig(user.empresaId, agentSlug);
}

// Usa config do banco ou fallback
const config = agentConfig || DEFAULT_AGENT_CONFIG;

// Modo determinado pelo integration_type
const useMastra = config.integrationType === "mastra";
```

#### Feature 2: System Prompt Dinamico

**O que foi feito:**

O system prompt agora vem do banco de dados e e passado para o agente:

```typescript
createMastraWithContext(userContext, {
  agentId: config.slug,
  agentName: config.name,
  systemPrompt: config.systemPrompt ?? undefined,  // Do banco!
  model: config.model,
  temperature: config.temperature,
});
```

**Beneficio:** Alterar o comportamento do agente sem redeploy.

#### Feature 3: Model e Temperature Configuraveis

**O que foi feito:**

O modelo LLM e a temperatura agora sao lidos do banco:

```typescript
// Para modo Mastra
model: openai(config.model)  // ex: "gpt-4o-mini", "gpt-4o"

// Para modo CopilotKit
const configuredOpenAIAdapter = new OpenAIAdapter({
  openai,
  model: config.model || "gpt-4o-mini",
});
```

**Modelos suportados:** Qualquer modelo disponivel na OpenAI (gpt-4o-mini, gpt-4o, gpt-4-turbo, etc.)

### 13.3 Arquivos Modificados

| Arquivo | Tipo de Alteracao | Descricao |
|---------|-------------------|-----------|
| `/app/api/copilotkit/route.ts` | Modificado | Adiciona leitura de config do banco |
| `/app/shared/lib/mastra/tools/index.ts` | Modificado | Corrige assinatura do execute para 0.24.x |
| `/package.json` | Modificado | Downgrade @mastra/core para ^0.24.9 |
| `/docs/ref/copilotkit-mastra-implementation-review.md` | Modificado | Documentacao atualizada |

### 13.4 Arquivos Deletados

| Arquivo | Motivo |
|---------|--------|
| `/app/api/copilotkit-embedded/route.ts` | Rota quebrada, duplicada |

---

## 14. Proximos Passos Detalhados

### 14.1 PRIORIDADE ALTA: Interface Admin para AI Agents

**Objetivo:** Criar interface para gerenciar agentes sem acesso direto ao banco.

**Funcionalidades necessarias:**
1. Listar agentes da empresa
2. Criar novo agente
3. Editar agente existente (system prompt, model, temperature)
4. Ativar/desativar agente
5. Definir agente padrao

**Arquivos a criar:**
```
/app/[tenant]/(admin)/configuracoes/ai-agents/
├── page.tsx              # Lista de agentes
├── [id]/page.tsx         # Editar agente
├── novo/page.tsx         # Criar agente
└── components/
    ├── agent-form.tsx    # Formulario de agente
    ├── agent-list.tsx    # Lista de agentes
    └── agent-card.tsx    # Card de agente
```

**Campos do formulario:**
- Nome do agente
- Slug (identificador unico)
- System Prompt (textarea grande)
- Modelo (select: gpt-4o-mini, gpt-4o, etc.)
- Temperature (slider 0-2)
- Tipo de integracao (copilotkit, mastra)
- Avatar URL
- Mensagem de saudacao
- Placeholder do input
- Ativo (toggle)
- Padrao (toggle)

### 14.2 PRIORIDADE ALTA: Frontend Agent Slug Header

**Objetivo:** Frontend deve enviar qual agente usar.

**Alteracoes necessarias:**

1. **CopilotKitProvider** - Adicionar prop para agentSlug:
```tsx
// /app/shared/components/providers/copilotkit-provider.tsx
<CopilotKit
  runtimeUrl="/api/copilotkit"
  headers={{
    Authorization: `Bearer ${accessToken}`,
    'X-CopilotKit-Agent-Slug': agentSlug,  // NOVO
  }}
>
```

2. **Pagina do TobIAs** - Buscar slug do agente:
```tsx
// Opcao 1: Da URL
const { agentSlug } = useParams();

// Opcao 2: Do contexto/config
const agentConfig = useAgentConfig();
```

### 14.3 PRIORIDADE MEDIA: Testar com Tenant Real

**Checklist de testes:**

1. [ ] Criar registro na tabela `ai_agents` para tenant CDF
2. [ ] Verificar que API busca config corretamente
3. [ ] Testar modo copilotkit (integration_type = 'copilotkit')
4. [ ] Testar modo mastra (integration_type = 'mastra')
5. [ ] Testar fallback quando nao ha config
6. [ ] Testar troca de system prompt em tempo real
7. [ ] Testar diferentes modelos (gpt-4o-mini vs gpt-4o)

**SQL para criar agente de teste:**
```sql
INSERT INTO ai_agents (
  empresa_id,
  slug,
  name,
  system_prompt,
  model,
  temperature,
  integration_type,
  is_active,
  is_default
) VALUES (
  'UUID_DA_EMPRESA_CDF',
  'tobias',
  'TobIAs - Assistente de Estudos',
  'Voce e o TobIAs, assistente de estudos do Aluminify.
   Ajude os alunos a encontrar cursos, verificar progresso
   e tirar duvidas sobre seus estudos.
   Seja sempre educado e motivador.',
  'gpt-4o-mini',
  0.7,
  'mastra',
  true,
  true
);
```

### 14.4 PRIORIDADE MEDIA: Human-in-the-Loop

**Objetivo:** Permitir que o agente peca confirmacao antes de executar acoes.

**Documentacao oficial:** https://docs.copilotkit.ai/mastra/human-in-the-loop

**Implementacao:**
```typescript
// No frontend
import { useHumanInTheLoop } from "@copilotkit/react-core";

const { confirmAction } = useHumanInTheLoop();

// No agente, antes de executar acao sensivel
await confirmAction({
  title: "Confirmar acao",
  description: "Deseja realmente fazer X?",
});
```

### 14.5 PRIORIDADE BAIXA: Mastra Studio

**Objetivo:** Ambiente de desenvolvimento para testar agentes.

**Passos:**
1. Instalar CLI: `npm install mastra`
2. Criar `mastra.config.ts`
3. Adicionar script: `"mastra:dev": "mastra dev"`
4. Executar: `npm run mastra:dev`

**Nota:** NAO e necessario para producao. Apenas para desenvolvimento local.

---

## 15. Como Usar a Configuracao Dinamica

### 15.1 Para Administradores (via SQL/Supabase)

**Criar novo agente:**
```sql
INSERT INTO ai_agents (empresa_id, slug, name, system_prompt, model, integration_type, is_default)
VALUES ('empresa-uuid', 'meu-agente', 'Meu Agente', 'Voce e um assistente...', 'gpt-4o-mini', 'mastra', true);
```

**Alterar system prompt:**
```sql
UPDATE ai_agents
SET system_prompt = 'Novo prompt aqui...'
WHERE slug = 'tobias' AND empresa_id = 'empresa-uuid';
```

**Trocar modelo:**
```sql
UPDATE ai_agents
SET model = 'gpt-4o'  -- Modelo mais potente
WHERE slug = 'tobias';
```

**Alterar temperatura:**
```sql
UPDATE ai_agents
SET temperature = 0.3  -- Mais determinístico
WHERE slug = 'tobias';
```

### 15.2 Para Desenvolvedores

**Testar diferentes agentes:**
```bash
# Via header
curl -X POST /api/copilotkit \
  -H "Authorization: Bearer TOKEN" \
  -H "X-CopilotKit-Agent-Slug: meu-agente-teste"

# Via query param
curl -X POST "/api/copilotkit?agentSlug=meu-agente-teste" \
  -H "Authorization: Bearer TOKEN"
```

**Verificar logs:**
```
[CopilotKit] Agent config from database: {
  slug: 'tobias',
  name: 'TobIAs',
  integrationType: 'mastra',
  model: 'gpt-4o-mini'
}
[CopilotKit] Using Mastra agent mode via AG-UI protocol
```

### 15.3 Fluxo de Decisao do Modo

```
Request chega em /api/copilotkit
           |
           v
  Usuario autenticado?
    |           |
   Nao         Sim
    |           |
   401         Busca config no banco
               (empresaId + agentSlug)
                    |
           Config encontrada?
             |           |
            Nao         Sim
             |           |
      Usa DEFAULT    Usa config do banco
             |           |
             +-----------+
                   |
                   v
      integration_type == 'mastra'?
             |           |
            Nao         Sim
             |           |
      CopilotKit     Mastra Agent
      + Actions      + EmptyAdapter
      + OpenAI
```
