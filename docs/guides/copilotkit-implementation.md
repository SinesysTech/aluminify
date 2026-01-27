# Guia de Implementação do CopilotKit (Self-Hosting)

Este guia documenta o passo a passo para implementar o CopilotKit em uma aplicação Next.js existente usando **Self-Hosting** com o `CopilotRuntime` e `OpenAIAdapter`.

## Visão Geral

O CopilotKit é uma plataforma open-source para criar aplicações AI-powered com interfaces de chat e agentes inteligentes. Ele oferece:

- **Componentes de UI prontos**: CopilotChat, CopilotSidebar, CopilotPopup
- **Hooks React**: para integrar estado da aplicação com o copilot
- **Backend Runtime**: para comunicação com LLMs (self-hosted)
- **Suporte a MCP (Model Context Protocol)**: para conectar com servidores MCP

## Pré-requisitos

- Next.js 14+ com App Router
- Node.js 18+
- Uma chave de API do OpenAI (ou outro LLM provider compatível)

---

## Passo 1: Instalação das Dependências

Instale os pacotes necessários:

```bash
# Pacotes do frontend (UI e hooks)
pnpm add @copilotkit/react-core @copilotkit/react-ui

# Pacotes do backend (runtime para self-hosting)
pnpm add @copilotkit/runtime
```

**Pacotes instalados:**

| Pacote | Descrição |
|--------|-----------|
| `@copilotkit/react-core` | Hooks e provider React (useCopilotReadable, useFrontendTool, etc.) |
| `@copilotkit/react-ui` | Componentes de UI (CopilotChat, CopilotSidebar, CopilotPopup) |
| `@copilotkit/runtime` | Backend runtime com adapters para LLMs (OpenAIAdapter, etc.) |

---

## Passo 2: Configurar Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
# Chave da API do OpenAI (obrigatório para Self-Hosting)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Modelo padrão (opcional, padrão: gpt-4o)
OPENAI_MODEL=gpt-4o

# Chave do Copilot Cloud para Observabilidade (opcional, mas recomendado)
# Obtida gratuitamente em https://cloud.copilotkit.ai
# Use publicLicenseKey para Self-Hosting com observabilidade
NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY=ck_pub_your_key_here
```

> **Nota**: O `OpenAIAdapter` usa automaticamente a variável `OPENAI_API_KEY` do ambiente.

> **Observabilidade**: Mesmo usando Self-Hosting, você pode obter gratuitamente uma `publicLicenseKey` no [Copilot Cloud](https://cloud.copilotkit.ai) para habilitar os hooks de observabilidade (analytics, tracking de eventos e erros).

---

## Passo 3: Criar o Backend Runtime (API Route)

Este é o componente central do Self-Hosting. Crie o endpoint que processará as requisições do CopilotKit.

### 3.1 Criar o Arquivo da Route API

Crie o arquivo `app/api/copilotkit/route.ts`:

```tsx
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// ============================================
// 1. CONFIGURAR O ADAPTER DO LLM
// ============================================
// O OpenAIAdapter usa automaticamente process.env.OPENAI_API_KEY
const serviceAdapter = new OpenAIAdapter({
  // Configurações opcionais:
  // model: "gpt-4o",           // Modelo a ser usado (padrão: gpt-4o)
  // temperature: 0.7,          // Temperatura para respostas
});

// ============================================
// 2. CRIAR O COPILOT RUNTIME
// ============================================
const runtime = new CopilotRuntime({
  // Backend actions (ferramentas que rodam no servidor)
  actions: ({ properties, url }) => {
    // `properties` - propriedades customizadas enviadas do frontend
    // `url` - URL atual do frontend

    return [
      // Exemplo de backend action
      {
        name: "getServerTime",
        description: "Retorna a hora atual do servidor",
        parameters: [],
        handler: async () => {
          return { time: new Date().toISOString() };
        },
      },
    ];
  },
});

// ============================================
// 3. EXPORTAR O HANDLER POST
// ============================================
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
```

### 3.2 Entendendo os Componentes

#### OpenAIAdapter

O `OpenAIAdapter` é responsável pela comunicação com a API do OpenAI:

```tsx
import { OpenAIAdapter } from "@copilotkit/runtime";

const serviceAdapter = new OpenAIAdapter({
  // Todas as opções são opcionais
  model: "gpt-4o",              // Modelo (padrão: gpt-4o)
  temperature: 0.7,             // Criatividade (0-2)
  // apiKey: "sk-...",          // Usa OPENAI_API_KEY por padrão
});
```

#### CopilotRuntime

O `CopilotRuntime` gerencia o estado, histórico de mensagens e actions:

```tsx
import { CopilotRuntime } from "@copilotkit/runtime";

const runtime = new CopilotRuntime({
  // Backend actions disponíveis para o Copilot
  actions: ({ properties, url }) => [...],

  // Para integração com MCP (opcional)
  createMCPClient: async (config) => {...},
});
```

#### copilotRuntimeNextJSAppRouterEndpoint

Helper para criar o endpoint compatível com Next.js App Router:

```tsx
const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,           // Instância do CopilotRuntime
  serviceAdapter,    // Adapter do LLM
  endpoint: "/api/copilotkit",  // Caminho do endpoint
});
```

---

## Passo 4: Configurar o CopilotKit Provider

### 4.1 Importar os Estilos

No seu `app/layout.tsx`, importe os estilos CSS do CopilotKit:

```tsx
import "@copilotkit/react-ui/styles.css";
```

### 4.2 Criar o Provider Component

Crie o arquivo `components/providers/copilotkit-provider.tsx`:

```tsx
"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { ReactNode } from "react";

interface CopilotKitProviderProps {
  children: ReactNode;
}

export function CopilotKitProvider({ children }: CopilotKitProviderProps) {
  return (
    <CopilotKit
      // URL do endpoint self-hosted (obrigatório)
      runtimeUrl="/api/copilotkit"

      // Chave para observabilidade (opcional, mas recomendado)
      // Use publicLicenseKey para Self-Hosting com observabilidade
      publicLicenseKey={process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY}

      // Mostrar console de debug em desenvolvimento
      showDevConsole={process.env.NODE_ENV === "development"}

      // Handler global de erros para observabilidade (opcional)
      onError={(errorEvent) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[CopilotKit Error]", errorEvent);
        }
        // Em produção, envie para seu serviço de monitoramento:
        // Sentry.captureException(errorEvent.error, { extra: errorEvent.context });
      }}

      // Propriedades customizadas enviadas ao backend (opcional)
      // properties={{
      //   userId: "123",
      //   tenantId: "abc",
      // }}
    >
      {children}
    </CopilotKit>
  );
}
```

### 4.3 Adicionar o Provider ao Layout

No `app/layout.tsx`, envolva sua aplicação com o provider:

```tsx
import "@copilotkit/react-ui/styles.css";
import { CopilotKitProvider } from "@/components/providers/copilotkit-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <CopilotKitProvider>
          {children}
        </CopilotKitProvider>
      </body>
    </html>
  );
}
```

---

## Passo 5: Adicionar Componentes de Chat UI

O CopilotKit oferece três componentes de UI prontos. Todos compartilham a mesma base funcional, mas têm layouts diferentes.

### 5.1 CopilotChat (Flexível)

Componente flexível que pode ser colocado em qualquer lugar da página e redimensionado conforme necessário. Ideal para páginas dedicadas ao assistente.

```tsx
"use client";

import { CopilotChat } from "@copilotkit/react-ui";

export function ChatComponent() {
  return (
    <CopilotChat
      // Instruções de comportamento para a IA
      instructions="Você é o TobIAs, o assistente inteligente do sistema Aluminify.
        Ajude os usuários com dúvidas sobre pedidos, clientes, produtos e relatórios."

      // Labels customizados
      labels={{
        title: "TobIAs - Assistente Aluminify",
        initial: "Olá! Sou o TobIAs, seu assistente. Como posso ajudar você hoje?",
        placeholder: "Digite sua mensagem...",
        stopGenerating: "Parar",
        regenerateResponse: "Regenerar resposta",
      }}

      // Ícones customizados (opcional)
      icons={{
        sendIcon: <SendIcon />,
        stopIcon: <StopIcon />,
        regenerateIcon: <RefreshIcon />,
      }}

      // Classes CSS
      className="h-full w-full"

      // Hooks de observabilidade (requer publicLicenseKey)
      observabilityHooks={{
        onMessageSent: (message) => console.log("Mensagem:", message),
        onChatExpanded: () => console.log("Chat aberto"),
      }}
    />
  );
}
```

#### Props do CopilotChat

| Prop | Tipo | Descrição |
|------|------|-----------|
| `instructions` | `string` | Instruções de comportamento para a IA |
| `labels` | `object` | Customização de textos da interface |
| `icons` | `object` | Customização de ícones |
| `className` | `string` | Classes CSS adicionais |
| `makeSystemMessage` | `function` | Função para customizar a mensagem de sistema (avançado) |
| `observabilityHooks` | `object` | Hooks para tracking e analytics |

### 5.2 CopilotSidebar (Sidebar Colapsável)

Sidebar colapsável que envolve o conteúdo principal da aplicação. Ideal para uso em todo o app.

```tsx
"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";

export function AppWithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <CopilotSidebar
      // Estado inicial da sidebar
      defaultOpen={false}

      // Instruções de comportamento
      instructions="Você é o assistente do sistema Aluminify.
        Ajude os usuários a navegar pelo sistema e responda dúvidas."

      // Labels customizados
      labels={{
        title: "Assistente",
        initial: "Como posso ajudar?",
        placeholder: "Pergunte algo...",
      }}

      // Fechar ao clicar fora (padrão: true)
      clickOutsideToClose={true}

      // Callback quando o estado muda
      onSetOpen={(open) => console.log("Sidebar:", open ? "aberta" : "fechada")}

      // Atalho de teclado para abrir/fechar (padrão: Cmd+Shift+C / Ctrl+Shift+C)
      shortcut="mod+shift+a"

      // Ícones customizados
      icons={{
        openIcon: <ChatIcon />,
        closeIcon: <CloseIcon />,
        headerCloseIcon: <XIcon />,
      }}

      // Classes CSS
      className="border-l"
    >
      {children}
    </CopilotSidebar>
  );
}
```

#### Props Específicas do CopilotSidebar

| Prop | Tipo | Descrição |
|------|------|-----------|
| `defaultOpen` | `boolean` | Se a sidebar inicia aberta (padrão: `false`) |
| `clickOutsideToClose` | `boolean` | Fecha ao clicar fora (padrão: `true`) |
| `onSetOpen` | `(open: boolean) => void` | Callback quando o estado muda |
| `shortcut` | `string` | Atalho de teclado (padrão: `mod+shift+c`) |
| `children` | `ReactNode` | Conteúdo principal envolvido pela sidebar |

### 5.3 CopilotPopup (Flutuante)

Botão flutuante no canto da tela que abre um popup de chat. Ideal para assistência contextual não intrusiva.

```tsx
"use client";

import { CopilotPopup } from "@copilotkit/react-ui";

export function AppWithPopup() {
  return (
    <>
      <YourMainContent />
      <CopilotPopup
        instructions="Você é um assistente útil. Responda de forma concisa."
        labels={{
          title: "Assistente",
          initial: "Precisa de ajuda?",
        }}

        // Estado inicial
        defaultOpen={false}

        // Fechar ao clicar fora
        clickOutsideToClose={true}

        // Atalho de teclado
        shortcut="mod+/"

        // Ícones do botão flutuante
        icons={{
          openIcon: <MessageCircleIcon />,
          closeIcon: <XIcon />,
        }}
      />
    </>
  );
}
```

### 5.4 Customização de Labels

Todos os componentes aceitam o objeto `labels` para customização:

```tsx
labels={{
  // Mensagem inicial exibida ao abrir o chat
  initial: "Olá! Como posso ajudar?",

  // Título do chat
  title: "Assistente Aluminify",

  // Placeholder do campo de input
  placeholder: "Digite sua mensagem...",

  // Texto do botão de parar geração
  stopGenerating: "Parar",

  // Texto do botão de regenerar
  regenerateResponse: "Regenerar",
}}
```

### 5.5 Customização de Ícones

Todos os componentes aceitam o objeto `icons` para customização:

```tsx
icons={{
  openIcon: <YourOpenIcon />,         // Ícone do botão abrir chat
  closeIcon: <YourCloseIcon />,       // Ícone do botão fechar chat
  headerCloseIcon: <YourXIcon />,     // Ícone de fechar no header
  sendIcon: <YourSendIcon />,         // Ícone do botão enviar
  activityIcon: <YourLoadingIcon />,  // Ícone de atividade/loading
  spinnerIcon: <YourSpinnerIcon />,   // Ícone de spinner
  stopIcon: <YourStopIcon />,         // Ícone do botão parar
  regenerateIcon: <YourRefreshIcon />,// Ícone do botão regenerar
  pushToTalkIcon: <YourMicIcon />,    // Ícone push-to-talk (voice)
}}
```

### 5.6 Customização via CSS Variables

A forma mais simples de personalizar cores é usando CSS variables:

```tsx
import { CopilotKitCSSProperties } from "@copilotkit/react-ui";

<div
  style={{
    "--copilot-kit-primary-color": "#3B82F6",
    "--copilot-kit-contrast-color": "#FFFFFF",
    "--copilot-kit-background-color": "#F8FAFC",
    "--copilot-kit-secondary-color": "#FFFFFF",
    "--copilot-kit-secondary-contrast-color": "#1E293B",
    "--copilot-kit-separator-color": "#E2E8F0",
    "--copilot-kit-muted-color": "#94A3B8",
  } as CopilotKitCSSProperties}
>
  <CopilotChat {...props} />
</div>
```

| CSS Variable | Descrição |
|--------------|-----------|
| `--copilot-kit-primary-color` | Cor principal (botões, elementos interativos) |
| `--copilot-kit-contrast-color` | Cor de contraste (texto sobre primary) |
| `--copilot-kit-background-color` | Cor de fundo principal |
| `--copilot-kit-secondary-color` | Cor secundária (cards, painéis) |
| `--copilot-kit-secondary-contrast-color` | Cor do texto principal |
| `--copilot-kit-separator-color` | Cor de bordas e divisores |
| `--copilot-kit-muted-color` | Cor de elementos inativos/desabilitados |

### 5.7 Customização via CSS Classes

Para customização mais avançada, use as classes CSS do CopilotKit:

```css
/* globals.css */

/* Container de mensagens */
.copilotKitMessages {
  padding: 1rem;
  font-family: "Inter", sans-serif;
}

/* Mensagens do usuário */
.copilotKitUserMessage {
  background: #3B82F6;
  color: white;
  border-radius: 1rem;
}

/* Mensagens do assistente */
.copilotKitAssistantMessage {
  background: #F1F5F9;
  border-radius: 1rem;
}

/* Campo de input */
.copilotKitInput {
  border-radius: 0.5rem;
  border: 1px solid #E2E8F0;
}

/* Header do chat */
.copilotKitHeader {
  background: #1E293B;
  color: white;
}

/* Botão flutuante (Popup/Sidebar) */
.copilotKitButton {
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### 5.8 Headless UI (Totalmente Customizado)

Para controle total sobre a UI, use o hook `useCopilotChat`:

```tsx
"use client";

import { useCopilotChat } from "@copilotkit/react-core";

export function CustomChatInterface() {
  const {
    visibleMessages,  // Array de mensagens visíveis
    appendMessage,    // Função para enviar mensagem
    setMessages,      // Função para definir mensagens
    deleteMessage,    // Função para deletar mensagem
    reloadMessages,   // Função para recarregar mensagens
    stopGeneration,   // Função para parar geração
    isLoading,        // Boolean indicando se está carregando
  } = useCopilotChat();

  const handleSend = (content: string) => {
    appendMessage({
      role: "user",
      content,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Lista de mensagens */}
      <div className="flex-1 overflow-y-auto p-4">
        {visibleMessages.map((message) => (
          <div
            key={message.id}
            className={message.role === "user" ? "text-right" : "text-left"}
          >
            <div className={`inline-block p-3 rounded-lg ${
              message.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-100"
            }`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("message") as HTMLInputElement;
          handleSend(input.value);
          input.value = "";
        }}
        className="p-4 border-t"
      >
        <input
          name="message"
          placeholder="Digite sua mensagem..."
          className="w-full p-2 border rounded"
          disabled={isLoading}
        />
      </form>
    </div>
  );
}
```

### 5.9 Sub-Componentes Customizados

Você pode substituir sub-componentes individuais mantendo a estrutura base:

```tsx
import { CopilotChat } from "@copilotkit/react-ui";

// Componente customizado para mensagem do usuário
function CustomUserMessage({ message }) {
  return (
    <div className="flex items-start gap-2 justify-end">
      <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[80%]">
        {message.content}
      </div>
      <Avatar src="/user-avatar.png" />
    </div>
  );
}

// Componente customizado para mensagem do assistente
function CustomAssistantMessage({ message }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar src="/bot-avatar.png" />
      <div className="bg-gray-100 p-3 rounded-lg max-w-[80%]">
        {message.content || message.generativeUI}
      </div>
    </div>
  );
}

// Uso
<CopilotChat
  instructions="..."
  UserMessage={CustomUserMessage}
  AssistantMessage={CustomAssistantMessage}
/>
```

| Sub-Componente | Descrição |
|----------------|-----------|
| `UserMessage` | Renderiza mensagens do usuário |
| `AssistantMessage` | Renderiza mensagens da IA |
| `Window` | Container principal do chat |
| `Button` | Botão que abre/fecha o chat |
| `Header` | Cabeçalho do chat |
| `Messages` | Container da lista de mensagens |
| `Input` | Campo de entrada de texto |
| `Suggestions` | Sugestões de mensagens |

---

## Passo 6: Integrar Estado da Aplicação

### 6.1 useCopilotReadable

Permite que o Copilot tenha conhecimento do estado atual da aplicação:

```tsx
"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useState } from "react";

export function OrdersList() {
  const [orders, setOrders] = useState([
    { id: 1, client: "Cliente A", status: "pendente" },
    { id: 2, client: "Cliente B", status: "aprovado" },
  ]);

  // Disponibilizar estado para o Copilot
  useCopilotReadable({
    description: "Lista de pedidos ativos no sistema",
    value: orders,
  });

  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          {order.client} - {order.status}
        </li>
      ))}
    </ul>
  );
}
```

### 6.2 useCopilotReadable com Hierarquia

Para dados aninhados:

```tsx
"use client";

import { useCopilotReadable } from "@copilotkit/react-core";

function OrderItem({ order }) {
  // Contexto pai
  const orderContextId = useCopilotReadable({
    description: `Pedido #${order.id}`,
    value: order.client,
  });

  // Contextos filhos vinculados ao pai
  useCopilotReadable({
    description: "Status do pedido",
    value: order.status,
    parentId: orderContextId,
  });

  useCopilotReadable({
    description: "Itens do pedido",
    value: order.items,
    parentId: orderContextId,
  });

  return <div>{/* render */}</div>;
}
```

### 6.3 useCopilotAdditionalInstructions

Adiciona instruções contextuais baseadas na página atual:

```tsx
"use client";

import { useCopilotAdditionalInstructions } from "@copilotkit/react-core";

export function SettingsPage() {
  useCopilotAdditionalInstructions({
    instructions: `
      O usuário está na página de configurações.
      Foque em ajudá-lo com:
      - Configurações de perfil
      - Preferências de notificação
      - Configurações de segurança
    `,
    available: "enabled",
  });

  return <div>Configurações</div>;
}
```

---

## Passo 7: Criar Frontend Tools

### 7.1 useFrontendTool

Permite que o Copilot execute ações no frontend:

```tsx
"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import { useState } from "react";

export function OrderManager() {
  const [orders, setOrders] = useState([]);

  // Tool para criar novo pedido
  useFrontendTool({
    name: "createOrder",
    description: "Cria um novo pedido no sistema",
    parameters: [
      {
        name: "clientName",
        type: "string",
        description: "Nome do cliente",
        required: true,
      },
      {
        name: "items",
        type: "string[]",
        description: "Lista de itens do pedido",
        required: true,
      },
    ],
    handler: async ({ clientName, items }) => {
      const newOrder = {
        id: Date.now(),
        client: clientName,
        items,
        status: "pendente",
      };
      setOrders((prev) => [...prev, newOrder]);
      return `Pedido criado para ${clientName} com ${items.length} itens.`;
    },
  });

  // Tool para atualizar status
  useFrontendTool({
    name: "updateOrderStatus",
    description: "Atualiza o status de um pedido",
    parameters: [
      {
        name: "orderId",
        type: "number",
        description: "ID do pedido",
        required: true,
      },
      {
        name: "newStatus",
        type: "string",
        description: "Novo status (pendente, aprovado, finalizado)",
        required: true,
      },
    ],
    handler: async ({ orderId, newStatus }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      return `Status do pedido #${orderId} atualizado para ${newStatus}.`;
    },
  });

  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          #{order.id} - {order.client} - {order.status}
        </li>
      ))}
    </ul>
  );
}
```

---

## Passo 8: Criar Backend Actions

Backend actions rodam no servidor e têm acesso a recursos seguros (banco de dados, APIs externas, etc.).

### 8.1 Definir Actions no Runtime

No arquivo `app/api/copilotkit/route.ts`:

```tsx
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

const serviceAdapter = new OpenAIAdapter();

const runtime = new CopilotRuntime({
  actions: ({ properties, url }) => {
    return [
      // Action para buscar dados do banco
      {
        name: "fetchClientOrders",
        description: "Busca todos os pedidos de um cliente específico",
        parameters: [
          {
            name: "clientId",
            type: "string",
            description: "ID do cliente",
            required: true,
          },
        ],
        handler: async ({ clientId }: { clientId: string }) => {
          // Aqui você conecta ao seu banco de dados
          // const orders = await prisma.order.findMany({
          //   where: { clientId },
          // });

          // Exemplo mockado:
          const orders = [
            { id: 1, product: "Produto A", quantity: 10 },
            { id: 2, product: "Produto B", quantity: 5 },
          ];

          return {
            clientId,
            orders,
            total: orders.length,
          };
        },
      },

      // Action para gerar relatório
      {
        name: "generateSalesReport",
        description: "Gera um relatório de vendas para um período",
        parameters: [
          {
            name: "startDate",
            type: "string",
            description: "Data inicial (YYYY-MM-DD)",
            required: true,
          },
          {
            name: "endDate",
            type: "string",
            description: "Data final (YYYY-MM-DD)",
            required: true,
          },
        ],
        handler: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
          // Implementar lógica de relatório
          return {
            period: `${startDate} a ${endDate}`,
            totalSales: 150000,
            orderCount: 45,
            topProducts: ["Produto A", "Produto B", "Produto C"],
          };
        },
      },
    ];
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
```

### 8.2 Actions Dinâmicas Baseadas em URL/Properties

```tsx
const runtime = new CopilotRuntime({
  actions: ({ properties, url }) => {
    const actions = [];

    // Actions específicas para a página de pedidos
    if (url.includes("/orders")) {
      actions.push({
        name: "searchOrders",
        description: "Busca pedidos com filtros",
        parameters: [...],
        handler: async (params) => {...},
      });
    }

    // Actions específicas para admin
    if (properties?.role === "admin") {
      actions.push({
        name: "deleteUser",
        description: "Remove um usuário do sistema",
        parameters: [...],
        handler: async (params) => {...},
      });
    }

    return actions;
  },
});
```

---

## Passo 9: Generative UI (Opcional)

Renderiza componentes React customizados dentro do chat.

### 9.1 useRenderToolCall

```tsx
"use client";

import { useRenderToolCall } from "@copilotkit/react-core";

export function ToolRenderer() {
  useRenderToolCall({
    name: "showOrderCard",
    description: "Mostra um card com informações do pedido",
    parameters: [
      { name: "orderId", type: "number", required: true },
      { name: "client", type: "string", required: true },
      { name: "status", type: "string", required: true },
      { name: "total", type: "number", required: true },
    ],
    render: ({ status, args }) => {
      // status pode ser: "inProgress", "executing", "complete"
      if (status === "inProgress") {
        return (
          <div className="animate-pulse bg-gray-200 p-4 rounded">
            Carregando pedido...
          </div>
        );
      }

      return (
        <div className="p-4 border rounded shadow">
          <h3 className="font-bold">Pedido #{args.orderId}</h3>
          <p>Cliente: {args.client}</p>
          <p>Status: {args.status}</p>
          <p className="font-bold">Total: R$ {args.total.toFixed(2)}</p>
        </div>
      );
    },
  });

  return null;
}
```

---

## Passo 10: Human in the Loop (HITL)

Para interações que precisam de confirmação do usuário antes de executar.

### useHumanInTheLoop

```tsx
"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core";

export function DeleteConfirmation() {
  useHumanInTheLoop({
    name: "confirmDeletion",
    description: "Pede confirmação antes de deletar um item",
    parameters: [
      {
        name: "itemType",
        type: "string",
        description: "Tipo do item (pedido, cliente, produto)",
        required: true,
      },
      {
        name: "itemId",
        type: "string",
        description: "ID do item",
        required: true,
      },
      {
        name: "itemName",
        type: "string",
        description: "Nome do item para exibição",
        required: true,
      },
    ],
    render: ({ args, status, respond }) => {
      if (status === "executing" && respond) {
        return (
          <div className="p-4 border border-red-300 rounded bg-red-50">
            <p className="text-red-800 font-medium">
              Tem certeza que deseja deletar o {args.itemType} "{args.itemName}" (ID: {args.itemId})?
            </p>
            <p className="text-red-600 text-sm mt-1">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => respond({ confirmed: true, itemId: args.itemId })}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Sim, Deletar
              </button>
              <button
                onClick={() => respond({ confirmed: false })}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        );
      }

      if (status === "complete") {
        return (
          <div className="text-sm text-gray-500">
            Ação processada.
          </div>
        );
      }

      return null;
    },
  });

  return null;
}
```

---

## Passo 11: Observabilidade (Opcional, mas Recomendado)

O CopilotKit oferece recursos de observabilidade para monitorar interações do usuário, eventos do chat e erros do sistema. **Mesmo usando Self-Hosting**, você pode habilitar observabilidade através de uma chave gratuita do Copilot Cloud.

### 11.1 Obter a Chave de Observabilidade

1. Acesse [https://cloud.copilotkit.ai](https://cloud.copilotkit.ai) (gratuito)
2. Crie uma conta ou faça login
3. Obtenha sua `publicLicenseKey` (formato: `ck_pub_...`)
4. Adicione ao `.env.local`: `NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY=ck_pub_your_key`

> **Importante**: Os hooks de observabilidade **não funcionam** sem uma chave válida. Esta é uma medida de segurança para garantir que os hooks só funcionem em aplicações autorizadas.

### 11.2 Observability Hooks no CopilotChat

Os componentes de UI (`CopilotChat`, `CopilotSidebar`, `CopilotPopup`) aceitam um objeto `observabilityHooks`:

```tsx
"use client";

import { CopilotChat } from "@copilotkit/react-ui";

export function ChatWithObservability() {
  return (
    <CopilotChat
      instructions="Você é o assistente Aluminify"
      observabilityHooks={{
        // Quando o usuário envia uma mensagem
        onMessageSent: (message) => {
          console.log("Mensagem enviada:", message);
          // analytics.track("chat_message_sent", { message });
        },

        // Quando o chat é expandido/aberto
        onChatExpanded: () => {
          console.log("Chat expandido");
          // analytics.track("chat_expanded");
        },

        // Quando o chat é minimizado/fechado
        onChatMinimized: () => {
          console.log("Chat minimizado");
          // analytics.track("chat_minimized");
        },

        // Quando o usuário regenera uma resposta
        onMessageRegenerated: (messageId) => {
          console.log("Mensagem regenerada:", messageId);
          // analytics.track("message_regenerated", { messageId });
        },

        // Quando o usuário copia uma mensagem
        onMessageCopied: (content) => {
          console.log("Mensagem copiada, tamanho:", content.length);
          // analytics.track("message_copied", { contentLength: content.length });
        },

        // Quando o usuário dá feedback (thumbs up/down)
        onFeedbackGiven: (messageId, type) => {
          console.log("Feedback:", type, "para mensagem:", messageId);
          // analytics.track("feedback_given", { messageId, type });
        },

        // Quando a geração de resposta começa
        onChatStarted: () => {
          console.log("IA começou a responder");
          // analytics.track("generation_started");
        },

        // Quando a geração de resposta termina
        onChatStopped: () => {
          console.log("IA terminou de responder");
          // analytics.track("generation_stopped");
        },

        // Quando ocorre um erro no chat
        onError: (errorEvent) => {
          console.error("Erro no chat:", errorEvent);
          // Sentry.captureException(errorEvent);
        },
      }}
    />
  );
}
```

### 11.3 Error Observability no Provider

Além dos hooks do chat, você pode capturar erros globais no `CopilotKit` provider:

```tsx
"use client";

import { CopilotKit } from "@copilotkit/react-core";

export function CopilotKitProviderWithErrorTracking({ children }) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      publicLicenseKey={process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY}
      showDevConsole={process.env.NODE_ENV === "development"}
      onError={(errorEvent) => {
        // Estrutura do errorEvent:
        // {
        //   type: "error" | "request" | "response" | "agent_state" | "action" | "message" | "performance",
        //   timestamp: number,
        //   context: {
        //     source: "ui" | "runtime" | "agent",
        //     request?: { operation, method, url, startTime },
        //     response?: { endTime, latency },
        //     agent?: { name, nodeName },
        //     messages?: { input, messageCount },
        //     technical?: { environment, stackTrace },
        //   },
        //   error?: any,
        // }

        if (errorEvent.type === "error") {
          console.error("[CopilotKit Error]", {
            type: errorEvent.type,
            timestamp: new Date(errorEvent.timestamp).toISOString(),
            source: errorEvent.context.source,
            error: errorEvent.error,
          });

          // Integração com Sentry (exemplo)
          // Sentry.captureException(errorEvent.error, {
          //   tags: { source: errorEvent.context.source },
          //   extra: { context: errorEvent.context },
          // });

          // Integração com analytics
          // analytics.track("copilotkit_error", {
          //   type: errorEvent.type,
          //   source: errorEvent.context.source,
          //   latency: errorEvent.context.response?.latency,
          // });
        }
      }}
    >
      {children}
    </CopilotKit>
  );
}
```

### 11.4 Hooks de Observabilidade Disponíveis

| Hook | Descrição | Parâmetros |
|------|-----------|------------|
| `onMessageSent` | Usuário envia mensagem | `message: string` |
| `onChatExpanded` | Chat é aberto/expandido | - |
| `onChatMinimized` | Chat é fechado/minimizado | - |
| `onMessageRegenerated` | Mensagem é regenerada | `messageId: string` |
| `onMessageCopied` | Mensagem é copiada | `content: string` |
| `onFeedbackGiven` | Feedback (thumbs up/down) | `messageId: string, type: "up" \| "down"` |
| `onChatStarted` | IA começa a gerar resposta | - |
| `onChatStopped` | IA termina de gerar resposta | - |
| `onError` | Erro ocorre no chat | `errorEvent: CopilotErrorEvent` |

### 11.5 Configuração para Produção

```tsx
// Configuração completa para ambiente de produção
<CopilotKit
  runtimeUrl="/api/copilotkit"
  publicLicenseKey={process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY}
  showDevConsole={false} // Esconder em produção
  onError={(errorEvent) => {
    // Log para sistema de monitoramento
    if (errorEvent.type === "error") {
      logger.error("CopilotKit Error", {
        error: errorEvent.error,
        context: errorEvent.context,
        timestamp: errorEvent.timestamp,
      });

      // Enviar para serviço de monitoramento
      monitoring.captureError(errorEvent.error, {
        extra: errorEvent.context,
      });
    }
  }}
>
  <CopilotChat
    observabilityHooks={{
      onMessageSent: (message) => {
        analytics.track("chat_message_sent", {
          messageLength: message.length,
          userId: getCurrentUserId(),
        });
      },
      onFeedbackGiven: (messageId, type) => {
        analytics.track("chat_feedback", { messageId, type });
      },
    }}
  />
</CopilotKit>
```

---

## Passo 12: Integração com Mastra AI (Orquestrador de Agentes)

O CopilotKit oferece integração nativa com **Mastra AI**, um framework TypeScript para orquestração de agentes inteligentes. Esta seção documenta como integrar Mastra como backend do CopilotKit, oferecendo uma alternativa mais poderosa ao uso direto de LLMs.

### 12.1 LLM Direto vs Mastra: Quando Usar Cada Abordagem

#### Opção 1: LLM Direto (OpenAIAdapter)

**Quando usar:**
- Casos simples de chat e assistência
- Não precisa de múltiplos agentes especializados
- Não precisa de memória persistente entre sessões
- Funcionalidades básicas são suficientes

```tsx
// Abordagem direta com OpenAIAdapter (já documentada acima)
const serviceAdapter = new OpenAIAdapter();
```

#### Opção 2: Mastra AI (Framework de Agentes)

**Quando usar:**
- Precisa de múltiplos agentes especializados
- Quer memória persistente e contexto entre sessões
- Precisa de workflows complexos com múltiplos passos
- Quer usar ferramentas (tools) estruturadas e reutilizáveis
- Precisa de orquestração avançada de agentes

**Vantagens do Mastra:**
- **Agentes estruturados**: Definição clara de agentes com instruções, tools e modelo
- **Memory**: Sistema de memória com Working Memory (estado do agente) e histórico
- **Tools tipadas**: Ferramentas com schemas Zod para input/output
- **AG-UI Protocol**: Integração nativa com CopilotKit
- **Storage flexível**: LibSQL, Postgres, MongoDB, Upstash, etc.
- **Múltiplos LLMs**: Suporte a OpenAI, Anthropic, Google, etc. via AI SDK

### 12.2 Instalação de Dependências Mastra

```bash
# Core Mastra
pnpm add @mastra/core @mastra/memory

# Storage (escolha um)
pnpm add @mastra/libsql    # SQLite in-memory ou arquivo (dev/testes)
pnpm add @mastra/pg        # PostgreSQL (produção)
pnpm add @mastra/mongodb   # MongoDB
pnpm add @mastra/upstash   # Upstash Redis

# AI SDK para modelos
pnpm add @ai-sdk/openai    # OpenAI
pnpm add @ai-sdk/anthropic # Anthropic (opcional)

# Integração AG-UI (protocolo de comunicação Mastra <-> CopilotKit)
pnpm add @ag-ui/mastra
```

### 12.3 Estrutura de Arquivos para Mastra

```
src/
├── mastra/
│   ├── index.ts          # Instância principal do Mastra
│   ├── agents/
│   │   └── index.ts      # Definição dos agentes
│   └── tools/
│       └── index.ts      # Ferramentas (tools) dos agentes
├── app/
│   └── api/
│       └── copilotkit/
│           └── route.ts  # Endpoint que conecta CopilotKit ao Mastra
└── lib/
    └── types.ts          # Tipos compartilhados (estado do agente)
```

### 12.4 Configurar a Instância Mastra

Crie o arquivo `src/mastra/index.ts`:

```tsx
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";
import { myAgent } from "./agents";

// Nível de log configurável via variável de ambiente
const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || "info";

export const mastra = new Mastra({
  // Registro de todos os agentes disponíveis
  agents: {
    myAgent, // Nome usado para referenciar o agente
    // Adicione mais agentes conforme necessário:
    // salesAgent,
    // supportAgent,
  },

  // Storage para persistência de dados do Mastra
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.DATABASE_URL || ":memory:", // In-memory para dev
  }),

  // Logger para debugging
  logger: new ConsoleLogger({
    level: LOG_LEVEL,
  }),
});
```

### 12.5 Criar Agentes Mastra

Crie o arquivo `src/mastra/agents/index.ts`:

```tsx
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { orderTool, clientTool, reportTool } from "../tools";

// Schema do estado do agente (Working Memory)
export const AgentState = z.object({
  // Dados que o agente mantém entre conversas
  currentContext: z.string().default(""),
  recentActions: z.array(z.string()).default([]),
  userPreferences: z.record(z.string()).default({}),
});

// Definição do Agente Principal
export const myAgent = new Agent({
  // Identificador único do agente
  id: "aluminify-assistant",
  name: "TobIAs - Assistente Aluminify",

  // Modelo LLM a ser usado
  model: openai("gpt-4o"),

  // Instruções de comportamento (system prompt)
  instructions: `
    Você é o TobIAs, o assistente inteligente do sistema Aluminify ERP.

    Suas responsabilidades:
    - Ajudar usuários com pedidos, clientes e produtos
    - Gerar relatórios e análises
    - Fornecer informações do sistema

    Diretrizes:
    - Seja conciso e objetivo
    - Use dados reais quando disponíveis via tools
    - Confirme ações importantes antes de executar
    - Responda sempre em português brasileiro
  `,

  // Ferramentas disponíveis para o agente
  tools: {
    orderTool,
    clientTool,
    reportTool,
  },

  // Configuração de memória (opcional, mas recomendado)
  memory: new Memory({
    storage: new LibSQLStore({
      id: "agent-memory",
      url: process.env.MEMORY_DATABASE_URL || "file::memory:",
    }),
    options: {
      // Working Memory: estado estruturado do agente
      workingMemory: {
        enabled: true,
        schema: AgentState,
      },
      // Histórico de mensagens
      lastMessages: 20, // Manter últimas 20 mensagens
    },
  }),
});
```

### 12.6 Criar Tools (Ferramentas) do Agente

Crie o arquivo `src/mastra/tools/index.ts`:

```tsx
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Schema de resultado tipado
const OrderResultSchema = z.object({
  id: z.number(),
  client: z.string(),
  status: z.string(),
  total: z.number(),
  items: z.array(z.object({
    product: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
});

// Tool para buscar pedidos
export const orderTool = createTool({
  id: "search-orders",
  description: "Busca pedidos no sistema com base em filtros",

  // Schema de entrada com Zod
  inputSchema: z.object({
    clientId: z.string().optional().describe("ID do cliente"),
    status: z.enum(["pending", "approved", "delivered", "cancelled"]).optional(),
    startDate: z.string().optional().describe("Data inicial (YYYY-MM-DD)"),
    endDate: z.string().optional().describe("Data final (YYYY-MM-DD)"),
  }),

  // Schema de saída tipado
  outputSchema: z.object({
    orders: z.array(OrderResultSchema),
    total: z.number(),
  }),

  // Handler que executa a lógica
  execute: async ({ clientId, status, startDate, endDate }) => {
    // Aqui você conecta ao seu banco de dados
    // const orders = await prisma.order.findMany({
    //   where: { clientId, status, createdAt: { gte: startDate, lte: endDate } },
    // });

    // Exemplo mockado:
    const orders = [
      {
        id: 1,
        client: "Cliente Exemplo",
        status: "approved",
        total: 1500.0,
        items: [{ product: "Produto A", quantity: 10, price: 150.0 }],
      },
    ];

    return { orders, total: orders.length };
  },
});

// Tool para buscar clientes
export const clientTool = createTool({
  id: "search-clients",
  description: "Busca informações de clientes",

  inputSchema: z.object({
    query: z.string().describe("Nome ou ID do cliente"),
  }),

  outputSchema: z.object({
    clients: z.array(z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      totalOrders: z.number(),
    })),
  }),

  execute: async ({ query }) => {
    // Implementar busca no banco
    return {
      clients: [
        { id: "1", name: "Cliente Exemplo", email: "cliente@example.com", totalOrders: 15 },
      ],
    };
  },
});

// Tool para gerar relatórios
export const reportTool = createTool({
  id: "generate-report",
  description: "Gera relatórios de vendas ou performance",

  inputSchema: z.object({
    type: z.enum(["sales", "inventory", "clients"]).describe("Tipo do relatório"),
    period: z.enum(["day", "week", "month", "year"]).describe("Período"),
  }),

  outputSchema: z.object({
    reportType: z.string(),
    period: z.string(),
    data: z.record(z.any()),
    generatedAt: z.string(),
  }),

  execute: async ({ type, period }) => {
    // Implementar geração de relatório
    return {
      reportType: type,
      period,
      data: {
        totalSales: 150000,
        orderCount: 45,
        topProducts: ["Produto A", "Produto B"],
      },
      generatedAt: new Date().toISOString(),
    };
  },
});
```

### 12.7 Conectar Mastra ao CopilotKit (API Route)

Atualize o arquivo `app/api/copilotkit/route.ts`:

```tsx
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { MastraAgent } from "@ag-ui/mastra";
import { NextRequest } from "next/server";
import { mastra } from "@/mastra";

// ============================================
// MASTRA + COPILOTKIT INTEGRATION
// ============================================

// Quando usando Mastra, usamos EmptyAdapter pois o Mastra gerencia o LLM
const serviceAdapter = new ExperimentalEmptyAdapter();

export const POST = async (req: NextRequest) => {
  // O MastraAgent.getLocalAgents() converte os agentes Mastra
  // para o formato AG-UI compatível com CopilotKit
  const runtime = new CopilotRuntime({
    // @ts-expect-error - Incompatibilidade temporária de tipos
    agents: MastraAgent.getLocalAgents({ mastra }),
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
```

### 12.8 Selecionar o Agente no Frontend

Quando você tem múltiplos agentes, especifique qual usar no provider:

```tsx
"use client";

import { CopilotKit } from "@copilotkit/react-core";

export function CopilotKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      // Especifica qual agente usar (deve corresponder ao nome em mastra.agents)
      agent="aluminify-assistant"
      publicLicenseKey={process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY}
      showDevConsole={process.env.NODE_ENV === "development"}
    >
      {children}
    </CopilotKit>
  );
}
```

### 12.9 Shared State com Mastra (useCoAgent)

Sincronize o estado do agente Mastra com o frontend:

```tsx
"use client";

import { useCoAgent } from "@copilotkit/react-core";
import { z } from "zod";

// Tipo do estado do agente (deve corresponder ao AgentState do Mastra)
type AgentState = z.infer<typeof import("@/mastra/agents").AgentState>;

export function AgentStateDisplay() {
  // Lê o estado atual do agente
  const { state, setState } = useCoAgent<AgentState>({
    name: "aluminify-assistant", // Nome do agente no Mastra
    initialState: {
      currentContext: "",
      recentActions: [],
      userPreferences: {},
    },
  });

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold">Estado do Agente</h3>
      <p>Contexto: {state.currentContext || "Nenhum"}</p>
      <p>Ações recentes: {state.recentActions.length}</p>

      {/* Atualizar estado do frontend para o agente */}
      <button
        onClick={() => setState({
          ...state,
          userPreferences: { ...state.userPreferences, theme: "dark" },
        })}
      >
        Definir preferência
      </button>
    </div>
  );
}
```

### 12.10 Renderizar Estado do Agente no Chat (Generative UI)

```tsx
"use client";

import { useCoAgentStateRender } from "@copilotkit/react-core";

type AgentState = {
  currentContext: string;
  recentActions: string[];
};

export function AgentStateRenderer() {
  // Renderiza o estado do agente DENTRO do chat
  useCoAgentStateRender<AgentState>({
    name: "aluminify-assistant",
    render: ({ state }) => {
      if (!state.recentActions?.length) return null;

      return (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800">Ações do Agente</h4>
          <ul className="text-sm text-blue-600">
            {state.recentActions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>
      );
    },
  });

  return null;
}
```

### 12.11 Human-in-the-Loop com Mastra

O Mastra suporta nativamente o protocolo AG-UI, então frontend tools funcionam automaticamente:

```tsx
"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core";

export function ApprovalFlow() {
  // Este hook cria uma tool disponível para o agente Mastra
  useHumanInTheLoop({
    name: "requestApproval",
    description: "Solicita aprovação do usuário antes de executar uma ação crítica",
    parameters: [
      {
        name: "action",
        type: "string",
        description: "Descrição da ação a ser aprovada",
        required: true,
      },
      {
        name: "details",
        type: "string",
        description: "Detalhes adicionais",
        required: false,
      },
    ],
    render: ({ args, respond }) => {
      if (!respond) return null;

      return (
        <div className="p-4 border rounded bg-yellow-50">
          <p className="font-medium">Confirmação Necessária</p>
          <p className="text-sm">{args.action}</p>
          {args.details && <p className="text-xs text-gray-500">{args.details}</p>}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => respond({ approved: true, action: args.action })}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Aprovar
            </button>
            <button
              onClick={() => respond({ approved: false, reason: "Cancelado pelo usuário" })}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Recusar
            </button>
          </div>
        </div>
      );
    },
  });

  return null;
}
```

### 12.12 Frontend Actions com Mastra

Frontend actions são automaticamente disponibilizadas para agentes Mastra:

```tsx
"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useRouter } from "next/navigation";

export function NavigationAction() {
  const router = useRouter();

  // Esta action fica disponível para o agente Mastra chamar
  useCopilotAction({
    name: "navigateToPage",
    description: "Navega para uma página específica do sistema",
    available: "remote", // Disponível apenas para o agente (não local)
    parameters: [
      {
        name: "page",
        type: "string",
        description: "Nome da página (orders, clients, reports, settings)",
        required: true,
      },
      {
        name: "id",
        type: "string",
        description: "ID opcional para navegação específica",
        required: false,
      },
    ],
    handler: async ({ page, id }) => {
      const routes: Record<string, string> = {
        orders: "/orders",
        clients: "/clients",
        reports: "/reports",
        settings: "/settings",
      };

      const basePath = routes[page] || "/";
      const path = id ? `${basePath}/${id}` : basePath;
      router.push(path);

      return `Navegando para ${path}`;
    },
  });

  return null;
}
```

### 12.13 Variáveis de Ambiente para Mastra

Adicione ao `.env.local`:

```env
# === PROVEDORES DE LLM ===

# OpenAI (se usar OpenAI diretamente)
OPENAI_API_KEY=sk-your-openai-api-key

# Google Gemini (se usar Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key

# Anthropic (se usar Claude diretamente)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# OpenRouter (alternativa - acesso a múltiplos modelos)
OPENROUTER_API_KEY=sk-or-your-openrouter-api-key

# === MASTRA STORAGE ===

# Database para Mastra Storage (produção - Turso/LibSQL)
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-auth-token

# Ou para desenvolvimento (in-memory)
# DATABASE_URL=:memory:

# Ou para desenvolvimento (arquivo local)
# DATABASE_URL=file:./data/mastra.db

# === MASTRA MEMORY ===

# Memory Database (pode ser o mesmo ou separado)
MEMORY_DATABASE_URL=file:./memory.db

# === LOGGING ===

# Log Level (debug, info, warn, error)
LOG_LEVEL=info

# === COPILOTKIT ===

# Observabilidade CopilotKit (gratuito em cloud.copilotkit.ai)
NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY=ck_pub_your_key
```

> **Nota:** Você só precisa configurar as variáveis dos provedores que pretende usar. Por exemplo, se usar apenas OpenAI, não precisa configurar `GOOGLE_GENERATIVE_AI_API_KEY` ou `OPENROUTER_API_KEY`.

### 12.14 Boas Práticas com Mastra

#### Separar Responsabilidades por Agente

```tsx
// Agente especializado em vendas
export const salesAgent = new Agent({
  id: "sales-agent",
  name: "Agente de Vendas",
  instructions: "Você é especialista em vendas e orçamentos...",
  tools: { orderTool, pricingTool, discountTool },
});

// Agente especializado em suporte
export const supportAgent = new Agent({
  id: "support-agent",
  name: "Agente de Suporte",
  instructions: "Você é especialista em suporte técnico...",
  tools: { ticketTool, knowledgeBaseTool },
});
```

#### Tools com Validação Robusta

```tsx
export const createOrderTool = createTool({
  id: "create-order",
  description: "Cria um novo pedido no sistema",
  inputSchema: z.object({
    clientId: z.string().uuid("ID do cliente deve ser um UUID válido"),
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive("Quantidade deve ser positiva"),
    })).min(1, "Pedido deve ter pelo menos um item"),
    notes: z.string().max(500).optional(),
  }),
  outputSchema: z.object({
    orderId: z.string(),
    status: z.literal("created"),
    total: z.number(),
  }),
  execute: async (input) => {
    // Validação automática pelo Zod
    // Implementar criação do pedido
    return { orderId: "new-id", status: "created", total: 0 };
  },
});
```

#### Memory com Processadores

```tsx
import { Memory, TokenBasedSummarizer } from "@mastra/memory";

const memory = new Memory({
  storage: new LibSQLStore({ id: "memory", url: "..." }),
  options: {
    workingMemory: { enabled: true, schema: AgentState },
    lastMessages: 50,
  },
  // Processadores para otimizar memória
  processors: [
    new TokenBasedSummarizer({
      maxTokens: 4000,
      model: openai("gpt-4o-mini"), // Modelo mais barato para sumarização
    }),
  ],
});
```

### 12.15 Provedores de LLM (OpenAI, Gemini, OpenRouter)

O Mastra utiliza o **AI SDK da Vercel** para comunicação com LLMs, suportando nativamente múltiplos provedores.

#### Provedores Suportados

| Provedor | Pacote | Exemplo de Modelo |
|----------|--------|-------------------|
| OpenAI | `@ai-sdk/openai` | `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| Google (Gemini) | `@ai-sdk/google` | `gemini-2.5-pro`, `gemini-1.5-flash` |
| Anthropic | `@ai-sdk/anthropic` | `claude-3-opus`, `claude-3-sonnet` |
| OpenRouter | `@ai-sdk/openai` (custom) | Qualquer modelo via OpenRouter |

#### Instalação dos Provedores

```bash
# OpenAI (padrão)
pnpm add @ai-sdk/openai

# Google Gemini
pnpm add @ai-sdk/google

# Anthropic
pnpm add @ai-sdk/anthropic
```

#### Usando OpenAI

```tsx
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

export const myAgent = new Agent({
  id: "agent-openai",
  model: openai("gpt-4o"),  // ou "gpt-4-turbo", "gpt-3.5-turbo"
  instructions: "...",
});
```

**Variável de ambiente:**
```env
OPENAI_API_KEY=sk-your-openai-api-key
```

#### Usando Google Gemini

```tsx
import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";

export const myAgent = new Agent({
  id: "agent-gemini",
  model: google("gemini-2.5-pro"),  // ou "gemini-1.5-flash"
  instructions: "...",
});
```

**Variável de ambiente:**
```env
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
```

#### Usando Múltiplos Provedores (OpenAI + Gemini)

Você pode ter agentes diferentes usando provedores diferentes:

```tsx
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";

// Agente principal com GPT-4o (mais capaz)
export const mainAgent = new Agent({
  id: "main-agent",
  model: openai("gpt-4o"),
  instructions: "Agente principal para tarefas complexas...",
});

// Agente secundário com Gemini (custo menor)
export const quickAgent = new Agent({
  id: "quick-agent",
  model: google("gemini-1.5-flash"),
  instructions: "Agente rápido para tarefas simples...",
});

// Registro no Mastra
export const mastra = new Mastra({
  agents: { mainAgent, quickAgent },
  // ...
});
```

#### Usando OpenRouter

O **OpenRouter** é um gateway que dá acesso a múltiplos modelos (OpenAI, Anthropic, Meta, etc.) com uma única API key. Para usá-lo, configure o `@ai-sdk/openai` com uma `baseURL` customizada:

```tsx
import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

// Configurar cliente OpenRouter
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Usar qualquer modelo disponível no OpenRouter
export const agentClaude = new Agent({
  id: "agent-claude-via-openrouter",
  model: openrouter("anthropic/claude-3-opus"),
  instructions: "...",
});

export const agentLlama = new Agent({
  id: "agent-llama-via-openrouter",
  model: openrouter("meta-llama/llama-3-70b-instruct"),
  instructions: "...",
});

export const agentMistral = new Agent({
  id: "agent-mistral-via-openrouter",
  model: openrouter("mistralai/mistral-large"),
  instructions: "...",
});
```

**Variável de ambiente:**
```env
OPENROUTER_API_KEY=sk-or-your-openrouter-api-key
```

**Vantagens do OpenRouter:**
- Acesso a 100+ modelos com uma única API key
- Fallback automático entre provedores
- Preços competitivos e pay-as-you-go
- Útil para testar diferentes modelos rapidamente

#### Formato de String para Modelos

Alternativamente, você pode usar o formato de string:

```tsx
export const myAgent = new Agent({
  model: "openai/gpt-4o",           // OpenAI
  // ou
  model: "google/gemini-2.5-pro",   // Google
  // ou
  model: "anthropic/claude-3-opus", // Anthropic
});
```

### 12.16 Instalação do Mastra em Repositório Existente

Você **não precisa** criar um repositório separado para usar o Mastra. Ele pode ser instalado diretamente no seu projeto Next.js existente.

#### Opção 1: Instalação Manual (Recomendada)

```bash
# Dentro do seu projeto existente
npx mastra@latest init
```

Este comando:
1. Detecta automaticamente seu framework (Next.js, etc.)
2. Cria a pasta `src/mastra/` com a estrutura necessária
3. Adiciona as dependências ao `package.json`
4. Configura os arquivos básicos (`index.ts`, `agents/`, `tools/`)

**Estrutura criada:**
```
src/
└── mastra/
    ├── index.ts          # Instância principal
    ├── agents/
    │   └── index.ts      # Seus agentes
    └── tools/
        └── index.ts      # Suas ferramentas
```

#### Opção 2: Criar Projeto Novo (Não Recomendado para Aluminify)

```bash
# Cria um NOVO projeto (repositório separado)
npx create-mastra@latest
```

**Quando usar:** Apenas para projetos greenfield ou microsserviços de agentes isolados.

#### Instalação Manual das Dependências

Se preferir controle total:

```bash
# Core
pnpm add @mastra/core

# Memory (opcional, mas recomendado)
pnpm add @mastra/memory

# Storage (escolha um)
pnpm add @mastra/libsql    # Dev/testes (SQLite)
pnpm add @mastra/pg        # Produção (PostgreSQL)

# AI SDK para seu provedor
pnpm add @ai-sdk/openai
pnpm add @ai-sdk/google    # Se usar Gemini

# Integração CopilotKit
pnpm add @ag-ui/mastra
```

### 12.17 Mastra Studio (Interface Gráfica)

O **Mastra Studio** é uma interface gráfica para testar e debugar agentes durante o desenvolvimento. Ele já vem incluído quando você instala o Mastra.

#### Iniciar o Studio

```bash
# Inicia o servidor de desenvolvimento do Mastra + Studio
npx mastra dev
```

O Studio fica disponível em: **http://localhost:4111/**

> **Nota:** O Studio roda em uma porta separada (4111) do seu app Next.js (3000), então ambos podem rodar simultaneamente.

#### Funcionalidades do Studio

| Funcionalidade | Descrição |
|----------------|-----------|
| **Chat com Agentes** | Testar conversas com seus agentes em tempo real |
| **Visualizar Tools** | Ver todas as ferramentas disponíveis e seus schemas |
| **Testar Tools** | Executar tools individualmente com inputs customizados |
| **Ver Logs** | Monitorar logs de execução e erros |
| **Inspecionar Memory** | Visualizar o estado da memória do agente |
| **Workflows** | Testar e debugar workflows (se usar) |

#### Exemplo de Uso

```bash
# Terminal 1: Seu app Next.js
pnpm dev
# → http://localhost:3000

# Terminal 2: Mastra Studio
npx mastra dev
# → http://localhost:4111
```

#### Configuração do Studio

O Studio usa as configurações do seu arquivo `src/mastra/index.ts`:

```tsx
import { Mastra } from "@mastra/core/mastra";

export const mastra = new Mastra({
  agents: { myAgent, salesAgent },
  // O Studio mostrará todos os agentes registrados aqui
});
```

#### Ambiente de Produção

O Studio é **apenas para desenvolvimento**. Em produção, use apenas a API:

```bash
# Desenvolvimento (com Studio)
npx mastra dev

# Produção (sem Studio)
pnpm build && pnpm start
```

### 12.18 Multi-Tenancy (Agentes por Tenant)

Para aplicações multi-tenant como o Aluminify, você pode configurar agentes e comportamentos específicos por tenant usando o **RuntimeContext** do Mastra.

#### Conceito: RuntimeContext

O `RuntimeContext` permite passar valores específicos por requisição que ficam disponíveis em:
- Instruções do agente (dinâmicas)
- Execução de tools
- Configuração de modelo

#### Implementação Básica

**1. No API Route, extrair dados do tenant:**

```tsx
// app/api/copilotkit/route.ts
import { RuntimeContext } from "@mastra/core/runtime-context";
import { MastraAgent } from "@ag-ui/mastra";
import { mastra } from "@/mastra";

export const POST = async (req: NextRequest) => {
  // Extrair tenant do header, cookie ou token JWT
  const tenantId = req.headers.get("x-tenant-id");
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");

  // Criar contexto de runtime
  const runtimeContext = new RuntimeContext();
  runtimeContext.set("tenantId", tenantId);
  runtimeContext.set("userId", userId);
  runtimeContext.set("userRole", userRole);

  // Carregar configurações do tenant do banco
  const tenantConfig = await getTenantConfig(tenantId);
  runtimeContext.set("tenantConfig", tenantConfig);

  const runtime = new CopilotRuntime({
    agents: MastraAgent.getLocalAgents({ mastra, runtimeContext }),
  });

  // ... resto da configuração
};
```

**2. Instruções Dinâmicas por Tenant:**

```tsx
// src/mastra/agents/index.ts
import { Agent } from "@mastra/core/agent";

export const myAgent = new Agent({
  id: "tenant-aware-agent",

  // Instruções podem ser uma função que recebe o runtimeContext
  instructions: async ({ runtimeContext }) => {
    const tenantId = runtimeContext?.get("tenantId");
    const tenantConfig = runtimeContext?.get("tenantConfig");

    // Instruções base
    let instructions = `
      Você é o assistente do sistema Aluminify.
      Tenant atual: ${tenantId}
    `;

    // Customizações por tenant
    if (tenantConfig?.customInstructions) {
      instructions += `\n\nInstruções específicas do tenant:\n${tenantConfig.customInstructions}`;
    }

    // Restrições por role
    const userRole = runtimeContext?.get("userRole");
    if (userRole === "viewer") {
      instructions += `\n\nATENÇÃO: Este usuário tem apenas permissão de leitura. Não execute ações que modifiquem dados.`;
    }

    return instructions;
  },

  tools: { orderTool, clientTool },
});
```

**3. Tools com Contexto de Tenant:**

```tsx
// src/mastra/tools/index.ts
import { createTool } from "@mastra/core/tools";

export const orderTool = createTool({
  id: "search-orders",
  description: "Busca pedidos do tenant atual",

  inputSchema: z.object({
    status: z.string().optional(),
  }),

  execute: async ({ status }, { runtimeContext }) => {
    // Filtrar automaticamente por tenant
    const tenantId = runtimeContext?.get("tenantId");

    const orders = await prisma.order.findMany({
      where: {
        tenantId,  // IMPORTANTE: Sempre filtrar por tenant
        status: status || undefined,
      },
    });

    return { orders, total: orders.length };
  },
});
```

#### Agentes Diferentes por Tenant

Se cada tenant precisar de agentes com configurações muito diferentes:

```tsx
// src/mastra/agents/tenant-factory.ts
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

interface TenantConfig {
  id: string;
  preferredModel: "openai" | "gemini";
  customInstructions: string;
  enabledTools: string[];
  tier: "free" | "pro" | "enterprise";
}

export function createAgentForTenant(config: TenantConfig) {
  // Modelo baseado na preferência/tier do tenant
  const model = config.preferredModel === "gemini"
    ? google("gemini-1.5-flash")
    : config.tier === "enterprise"
      ? openai("gpt-4o")
      : openai("gpt-3.5-turbo");

  // Filtrar tools baseado no plano
  const availableTools = getToolsForTier(config.tier, config.enabledTools);

  return new Agent({
    id: `agent-${config.id}`,
    model,
    instructions: `
      Você é o assistente do tenant ${config.id}.
      ${config.customInstructions}
    `,
    tools: availableTools,
  });
}

function getToolsForTier(tier: string, enabled: string[]) {
  const allTools = { orderTool, clientTool, reportTool, analyticsTool };

  if (tier === "free") {
    // Free: apenas tools básicas
    return { orderTool, clientTool };
  }

  if (tier === "pro") {
    // Pro: + relatórios
    return { orderTool, clientTool, reportTool };
  }

  // Enterprise: todas as tools habilitadas
  return Object.fromEntries(
    Object.entries(allTools).filter(([name]) => enabled.includes(name))
  );
}
```

**4. Registro Dinâmico de Agentes:**

```tsx
// app/api/copilotkit/route.ts
export const POST = async (req: NextRequest) => {
  const tenantId = req.headers.get("x-tenant-id");
  const tenantConfig = await getTenantConfig(tenantId);

  // Criar agente específico para este tenant
  const tenantAgent = createAgentForTenant(tenantConfig);

  // Registrar dinamicamente
  const dynamicMastra = new Mastra({
    agents: { [tenantAgent.id]: tenantAgent },
    storage: mastra.storage,
  });

  const runtime = new CopilotRuntime({
    agents: MastraAgent.getLocalAgents({ mastra: dynamicMastra }),
  });

  // ...
};
```

#### Variáveis de Ambiente por Tenant

Para casos onde cada tenant tem suas próprias API keys:

```tsx
// Carregar config do tenant do banco
const tenantConfig = await prisma.tenantConfig.findUnique({
  where: { id: tenantId },
  select: { openaiApiKey: true, preferredModel: true },
});

// Criar cliente com a key do tenant
const tenantOpenai = createOpenAI({
  apiKey: tenantConfig.openaiApiKey, // Key específica do tenant
});

const tenantAgent = new Agent({
  model: tenantOpenai(tenantConfig.preferredModel),
  // ...
});
```

#### Passando Tenant do Frontend

No frontend, configure o provider para enviar o tenant:

```tsx
// components/providers/copilotkit-provider.tsx
"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { useAuth } from "@/hooks/use-auth";

export function CopilotKitProvider({ children }) {
  const { user, tenant } = useAuth();

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="tenant-aware-agent"
      // Propriedades enviadas ao backend
      properties={{
        tenantId: tenant?.id,
        userId: user?.id,
        userRole: user?.role,
      }}
      // Headers customizados (alternativa)
      headers={{
        "x-tenant-id": tenant?.id,
        "x-user-id": user?.id,
        "x-user-role": user?.role,
      }}
    >
      {children}
    </CopilotKit>
  );
}
```

#### Resumo Multi-Tenancy

| Abordagem | Quando Usar |
|-----------|-------------|
| **RuntimeContext** | Instruções/tools levemente diferentes por tenant |
| **Agentes Dinâmicos** | Configurações muito diferentes (modelo, tools) |
| **API Keys por Tenant** | Cada tenant paga sua própria conta de LLM |

### 12.19 Resumo: Quando Escolher Cada Abordagem

| Critério | LLM Direto (OpenAIAdapter) | Mastra AI |
|----------|---------------------------|-----------|
| Complexidade | Baixa | Média-Alta |
| Múltiplos agentes | Não | Sim |
| Memória persistente | Não | Sim |
| Tools tipadas com Zod | Manual | Nativo |
| Workflows complexos | Limitado | Completo |
| Custo inicial de setup | Mínimo | Moderado |
| Escalabilidade | Limitada | Alta |
| Curva de aprendizado | Baixa | Moderada |

**Recomendação para o Aluminify:**
- Comece com LLM Direto para validar a UX do chat
- Migre para Mastra quando precisar de: múltiplos agentes especializados, memória entre sessões, ou workflows mais complexos

---

## Estrutura de Arquivos Recomendada

### Estrutura com LLM Direto (OpenAIAdapter)

```
src/
├── app/
│   ├── api/
│   │   └── copilotkit/
│   │       └── route.ts              # Backend runtime (OBRIGATÓRIO)
│   ├── layout.tsx                    # Provider + styles import
│   └── (pages)/
│       └── chat/
│           └── page.tsx              # Página com chat
├── components/
│   ├── providers/
│   │   └── copilotkit-provider.tsx   # CopilotKit provider
│   ├── copilot/
│   │   ├── chat-interface.tsx        # Componente de chat
│   │   ├── tool-renderer.tsx         # Generative UI components
│   │   └── context-providers.tsx     # useCopilotReadable hooks
│   └── ui/
│       └── ...
└── lib/
    └── copilot/
        └── actions.ts                # Helpers para actions
```

### Estrutura com Mastra AI (Recomendada para Produção)

```
src/
├── mastra/                           # ← Pasta Mastra (orquestrador de agentes)
│   ├── index.ts                      # Instância principal do Mastra
│   ├── agents/
│   │   ├── index.ts                  # Exports de todos os agentes
│   │   ├── assistant-agent.ts        # Agente principal (TobIAs)
│   │   ├── sales-agent.ts            # Agente especializado em vendas
│   │   └── support-agent.ts          # Agente de suporte
│   └── tools/
│       ├── index.ts                  # Exports de todas as tools
│       ├── order-tools.ts            # Tools de pedidos
│       ├── client-tools.ts           # Tools de clientes
│       └── report-tools.ts           # Tools de relatórios
├── app/
│   ├── api/
│   │   └── copilotkit/
│   │       └── route.ts              # Backend conectando CopilotKit + Mastra
│   ├── layout.tsx                    # Provider + styles import
│   └── (pages)/
│       └── tobias/
│           └── page.tsx              # Página do assistente TobIAs
├── components/
│   ├── providers/
│   │   └── copilotkit-provider.tsx   # CopilotKit provider com agent prop
│   ├── copilot/
│   │   ├── chat-interface.tsx        # Componente de chat
│   │   ├── agent-state-renderer.tsx  # Renderiza estado do agente (Generative UI)
│   │   ├── approval-flow.tsx         # Human-in-the-Loop components
│   │   └── navigation-action.tsx     # Frontend actions
│   └── ui/
│       └── ...
└── lib/
    ├── types.ts                      # Tipos compartilhados (AgentState)
    └── copilot/
        └── hooks.ts                  # Custom hooks para CopilotKit
```

---

## Troubleshooting

### Erro: "CopilotKit's Remote Endpoint not found"

- Verifique se o arquivo `app/api/copilotkit/route.ts` existe
- Confirme que o endpoint está acessível: `curl -X POST http://localhost:3000/api/copilotkit`
- Verifique que `runtimeUrl="/api/copilotkit"` está correto no provider

### Erro: "OPENAI_API_KEY not configured"

- Confirme que `OPENAI_API_KEY` está no `.env.local`
- Reinicie o servidor de desenvolvimento após adicionar a variável

### Dev Console não aparece

- Confirme `showDevConsole={true}` no provider
- Verifique se não há erros no console do navegador

### Hooks não funcionam

- Certifique-se de usar `"use client"` no topo do arquivo
- Confirme que o componente está dentro do `CopilotKitProvider`

### Backend actions não são chamadas

- Verifique se a action está retornada no array de `actions`
- Confirme que a descrição da action está clara para o LLM entender quando usá-la

### Observability hooks não disparam

- Confirme que você tem uma `publicLicenseKey` válida configurada
- Obtenha sua chave gratuita em [https://cloud.copilotkit.ai](https://cloud.copilotkit.ai)
- Verifique se a variável `NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY` está no `.env.local`
- Os hooks **não funcionam** sem uma chave válida (medida de segurança)

---

## Recursos Adicionais

### CopilotKit
- [Documentação Oficial CopilotKit](https://docs.copilotkit.ai)
- [GitHub CopilotKit](https://github.com/CopilotKit/CopilotKit)
- [Self-Hosting Guide](https://docs.copilotkit.ai/guides/self-hosting)
- [Observability Guide](https://docs.copilotkit.ai/adk/premium/observability)
- [Copilot Cloud Dashboard](https://cloud.copilotkit.ai) - Chave de observabilidade gratuita
- [Discord CopilotKit](https://discord.com/invite/6dffbvGU3D)

### Mastra AI (Orquestrador de Agentes)
- [CopilotKit + Mastra Quickstart](https://docs.copilotkit.ai/mastra/quickstart) - Guia inicial de integração
- [CopilotKit + Mastra Human-in-the-Loop](https://docs.copilotkit.ai/mastra/human-in-the-loop) - Implementação HITL
- [CopilotKit + Mastra Generative UI](https://docs.copilotkit.ai/mastra/generative-ui) - UI dinâmica
- [CopilotKit + Mastra Shared State](https://docs.copilotkit.ai/integrations/mastra/shared-state) - Sincronização de estado
- [CopilotKit + Mastra Frontend Actions](https://docs.copilotkit.ai/mastra/frontend-actions) - Actions no frontend
- [Documentação Oficial Mastra](https://mastra.ai/docs) - Documentação completa do Mastra
- [Mastra Agents](https://mastra.ai/docs/agents) - Criação de agentes
- [Mastra Tools](https://mastra.ai/docs/tools) - Criação de ferramentas
- [Mastra Memory](https://mastra.ai/docs/memory) - Sistema de memória
- [GitHub with-mastra](https://github.com/CopilotKit/with-mastra) - Exemplo oficial de integração

### AG-UI Protocol
- [AG-UI Protocol Documentation](https://docs.copilotkit.ai/ag-ui-protocol) - Protocolo de comunicação agente-UI
- [@ag-ui/mastra Package](https://www.npmjs.com/package/@ag-ui/mastra) - Pacote de integração

---

## Notas para o Aluminify

### Estratégia de Implementação Recomendada

#### Fase 1: MVP com LLM Direto
1. Implementar CopilotKit com OpenAIAdapter
2. Criar backend actions básicas (pedidos, clientes)
3. Configurar CopilotChat na página do TobIAs
4. Validar UX e coletar feedback

#### Fase 2: Migração para Mastra
1. Configurar estrutura Mastra (agents, tools)
2. Migrar backend actions para Mastra tools tipadas
3. Implementar Memory para contexto entre sessões
4. Adicionar agentes especializados conforme demanda

### Considerações de UX

| Componente | Caso de Uso | Recomendação |
|------------|-------------|--------------|
| **CopilotPopup** | Assistência contextual rápida | Páginas de listagem, dashboards |
| **CopilotSidebar** | Conversas longas, análises | Páginas de detalhes, relatórios |
| **CopilotChat** | Experiência dedicada | Página exclusiva do TobIAs |

### Agentes Mastra Sugeridos para o ERP

```tsx
// 1. Agente Principal (TobIAs)
const assistantAgent = new Agent({
  id: "tobias-assistant",
  instructions: "Agente generalista do Aluminify...",
  tools: { navigationTool, searchTool },
});

// 2. Agente de Vendas
const salesAgent = new Agent({
  id: "sales-agent",
  instructions: "Especialista em orçamentos e pedidos...",
  tools: { orderTool, pricingTool, discountTool },
});

// 3. Agente de Relatórios
const reportAgent = new Agent({
  id: "report-agent",
  instructions: "Especialista em análises e relatórios...",
  tools: { reportTool, analyticsTool, exportTool },
});
```

### Tools Mastra Recomendadas para o ERP

| Tool | Descrição | Agente |
|------|-----------|--------|
| `searchOrders` | Buscar pedidos com filtros | Sales, Assistant |
| `getClientInfo` | Obter informações de cliente | Sales, Assistant |
| `createQuote` | Criar orçamento | Sales |
| `calculatePricing` | Calcular preços com desconto | Sales |
| `generateSalesReport` | Relatório de vendas | Report |
| `generateInventoryReport` | Relatório de estoque | Report |
| `checkInventory` | Verificar disponibilidade | Sales, Assistant |
| `navigateToPage` | Navegar no sistema (frontend) | Assistant |

### Frontend Actions Recomendadas

```tsx
// Navegação pelo sistema
useCopilotAction({
  name: "navigateToPage",
  description: "Navega para páginas do sistema",
  handler: ({ page, id }) => router.push(`/${page}/${id || ""}`),
});

// Abrir modal de criação
useCopilotAction({
  name: "openCreateModal",
  description: "Abre modal para criar novo item",
  handler: ({ type }) => setModalOpen(type),
});

// Aplicar filtros em listagens
useCopilotAction({
  name: "applyFilters",
  description: "Aplica filtros na listagem atual",
  handler: ({ filters }) => setFilters(filters),
});
```

### Multi-Tenancy no Aluminify

O Aluminify é uma aplicação multi-tenant. Considerações para o TobIAs:

#### Isolamento de Dados por Tenant

```tsx
// Todas as tools devem filtrar por tenant
export const orderTool = createTool({
  id: "search-orders",
  execute: async (input, { runtimeContext }) => {
    const tenantId = runtimeContext?.get("tenantId");

    // SEMPRE filtrar por tenant
    const orders = await prisma.order.findMany({
      where: {
        tenantId,  // Isolamento obrigatório
        ...input.filters,
      },
    });

    return { orders };
  },
});
```

#### Configurações por Tenant

| Configuração | Descrição | Exemplo |
|--------------|-----------|---------|
| `preferredModel` | Modelo LLM preferido | `"gpt-4o"` ou `"gemini-1.5-flash"` |
| `customInstructions` | Instruções adicionais | Terminologia específica do cliente |
| `enabledTools` | Tools habilitadas | `["orders", "clients", "reports"]` |
| `maxTokensPerDay` | Limite de tokens diário | `100000` (para controle de custos) |

#### Passando Tenant do Frontend

```tsx
// O Aluminify já tem contexto de tenant via useAuth/useTenant
export function CopilotKitProvider({ children }) {
  const { tenant } = useTenant();
  const { user } = useAuth();

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      properties={{
        tenantId: tenant.id,
        tenantName: tenant.name,
        userId: user.id,
        userRole: user.role,
        userPermissions: user.permissions,
      }}
    >
      {children}
    </CopilotKit>
  );
}
```

### Roadmap de Implementação

```
┌─────────────────────────────────────────────────────────────┐
│                    FASE 1 - MVP (Semana 1-2)                │
├─────────────────────────────────────────────────────────────┤
│ ✓ Instalar dependências CopilotKit                          │
│ ✓ Criar endpoint /api/copilotkit com OpenAIAdapter          │
│ ✓ Configurar CopilotKitProvider no layout                   │
│ ✓ Implementar página TobIAs com CopilotChat                 │
│ ✓ Criar 3-5 backend actions básicas                         │
│ ✓ Configurar observabilidade com publicLicenseKey           │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FASE 2 - Mastra (Semana 3-4)              │
├─────────────────────────────────────────────────────────────┤
│ □ Instalar dependências Mastra                              │
│ □ Criar estrutura src/mastra/ (agents, tools)               │
│ □ Migrar backend actions para Mastra tools                  │
│ □ Configurar Memory com LibSQL/Postgres                     │
│ □ Implementar Working Memory para contexto                  │
│ □ Atualizar route.ts para usar MastraAgent                  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               FASE 3 - Recursos Avançados (Semana 5+)       │
├─────────────────────────────────────────────────────────────┤
│ □ Adicionar agentes especializados (Sales, Report)          │
│ □ Implementar Human-in-the-Loop para ações críticas         │
│ □ Adicionar Generative UI para resultados de tools          │
│ □ Implementar Shared State com useCoAgent                   │
│ □ Configurar frontend actions para navegação                │
│ □ Integrar com sistema de permissões do Aluminify           │
└─────────────────────────────────────────────────────────────┘
```

### Variáveis de Ambiente Completas

```env
# === PROVEDORES DE LLM (configure apenas os que usar) ===
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
OPENROUTER_API_KEY=sk-or-your-openrouter-key

# === Mastra Storage (Produção - Turso) ===
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-token

# === Mastra Memory ===
MEMORY_DATABASE_URL=libsql://your-memory-db.turso.io
MEMORY_AUTH_TOKEN=your-token

# === CopilotKit Observability ===
NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY=ck_pub_your_key

# === Debug ===
LOG_LEVEL=info
```

> **Dica:** Para o Aluminify, recomendamos começar apenas com `OPENAI_API_KEY` e adicionar outros provedores conforme a necessidade de otimização de custos ou funcionalidades específicas.
