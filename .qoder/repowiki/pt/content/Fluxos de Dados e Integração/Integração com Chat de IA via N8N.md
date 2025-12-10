# Integração com Chat de IA via N8N

<cite>
**Arquivos Referenciados neste Documento**  
- [conversations-panel.tsx](file://components/conversations-panel.tsx)
- [chat/route.ts](file://app/api/chat/route.ts)
- [chat.service.ts](file://backend/services/chat/chat.service.ts)
- [attachments.service.ts](file://backend/services/chat/attachments.service.ts)
- [conversation.service.ts](file://backend/services/conversation/conversation.service.ts)
- [chat.types.ts](file://backend/services/chat/chat.types.ts)
- [conversation.types.ts](file://backend/services/conversation/conversation.types.ts)
- [N8N_SETUP.md](file://docs/N8N_SETUP.md)
- [route.ts](file://app/api/chat/attachments/[id]/route.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Fluxo de Integração](#fluxo-de-integração)
3. [Estrutura da Requisição e Resposta JSON](#estrutura-da-requisição-e-resposta-json)
4. [Configuração do Webhook N8N](#configuração-do-webhook-n8n)
5. [Tratamento de Anexos](#tratamento-de-anexos)
6. [Estratégias de Retry, Timeout e Fallback](#estratégias-de-retry-timeout-e-fallback)
7. [Mensagens de Erro](#mensagens-de-erro)
8. [Persistência de Conversas](#persistência-de-conversas)
9. [Diagrama de Arquitetura](#diagrama-de-arquitetura)

## Introdução
Este documento detalha a integração do chat com IA utilizando o N8N no sistema TobIAs. O fluxo envolve o componente frontend `conversations-panel.tsx`, a rota da API `chat/route.ts`, o serviço `chat.service.ts`, o webhook do N8N, o processamento com agente, a resposta e o retorno ao frontend. Também são abordados o tratamento de anexos, estratégias de retry, timeout, fallback, mensagens de erro e a persistência de conversas no banco de dados.

## Fluxo de Integração
O fluxo de integração inicia-se no componente frontend `conversations-panel.tsx`, que envia uma mensagem para a rota da API `/api/chat`. A rota valida a requisição, processa anexos se houver, e encaminha a mensagem para o serviço `chat.service.ts`. Este serviço envia a mensagem ao webhook do N8N, que processa a mensagem com um agente e retorna a resposta. A resposta é então enviada de volta ao frontend para renderização.

**Fontes da Seção**
- [conversations-panel.tsx](file://components/conversations-panel.tsx#L72-L98)
- [chat/route.ts](file://app/api/chat/route.ts#L84-L251)
- [chat.service.ts](file://backend/services/chat/chat.service.ts#L8-L106)

## Estrutura da Requisição e Resposta JSON
A requisição para a API `/api/chat` pode ser enviada como `multipart/form-data` ou `application/json`. O corpo da requisição deve conter os campos `message`, `sessionId` e `userId`. A resposta da API é um objeto JSON com o campo `data` contendo a resposta do agente.

### Requisição
```json
{
  "message": "texto da mensagem",
  "sessionId": "session-id",
  "userId": "user-id"
}
```

### Resposta
```json
{
  "data": {
    "output": "resposta do agente"
  }
}
```

**Fontes da Seção**
- [chat/route.ts](file://app/api/chat/route.ts#L67-L83)
- [chat.service.ts](file://backend/services/chat/chat.service.ts#L21-L37)

## Configuração do Webhook N8N
O webhook do N8N é configurado para receber requisições POST no caminho `/webhook/9e35cb81-5314-4f09-bbde-0d587a8eb6db`. O webhook deve estar configurado para responder com o código 200 e retornar a resposta diretamente. O formato esperado da resposta é um objeto JSON com o campo `output`.

### Webhook de Entrada
1. Adicione um nó **Webhook**.
2. Configure:
   - **Método HTTP:** POST
   - **Caminho:** `/webhook/9e35cb81-5314-4f09-bbde-0d587a8eb6db`
   - **Modo de Resposta:** Respond to Webhook
   - **Código de Resposta:** 200

### Processar com o Agente
1. Adicione seu nó de processamento (IA, LLM, etc.).
2. Use `{{ $json.input }}` para acessar a mensagem do usuário.
3. Use `{{ $json.ids.sessionId }}` e `{{ $json.ids.userId }}` para acessar os IDs.

### Resposta do Webhook
O webhook deve retornar a resposta no seguinte formato:
```json
{
  "output": "Resposta do agente aqui"
}
```

**Fontes da Seção**
- [N8N_SETUP.md](file://docs/N8N_SETUP.md#L42-L114)
- [chat.service.ts](file://backend/services/chat/chat.service.ts#L4-L6)

## Tratamento de Anexos
O endpoint `/api/chat` aceita anexos via `multipart/form-data`. Os anexos são salvos temporariamente e enviados ao webhook com metadados. A URL do anexo é protegida por token e expira após 10 minutos ou após o primeiro download.

### Validação de Anexos
- Apenas um anexo por mensagem.
- Tipos permitidos: imagens (png, jpg, webp, gif) e PDF.
- Tamanho máximo por arquivo: 5MB.
- Tamanho total máximo: 15MB.

### Endpoint de Download
O endpoint `/api/chat/attachments/[id]/[filename]` fornece o download do anexo com autenticação por token.

**Fontes da Seção**
- [attachments.service.ts](file://backend/services/chat/attachments.service.ts#L7-L40)
- [route.ts](file://app/api/chat/attachments/[id]/route.ts#L7-L58)
- [CHAT_BACKEND_REVISION.md](file://docs/CHAT_BACKEND_REVISION.md#L53-L68)

## Estratégias de Retry, Timeout e Fallback
O serviço `chat.service.ts` implementa tratamento de erros com retry e fallback. Em caso de falha na comunicação com o webhook, uma mensagem de erro é retornada. O timeout é gerenciado pelo próprio fetch.

### Retry
O serviço não implementa retry automático, mas o frontend pode reenviar a mensagem em caso de erro.

### Fallback
Se a resposta do webhook estiver vazia, uma mensagem padrão é retornada: "Aguarde, processando sua mensagem...".

**Fontes da Seção**
- [chat.service.ts](file://backend/services/chat/chat.service.ts#L16-L37)
- [chat.service.ts](file://backend/services/chat/chat.service.ts#L96-L105)

## Mensagens de Erro
O sistema retorna mensagens de erro detalhadas em caso de falha na validação ou comunicação.

### Exemplos de Mensagens de Erro
- `Message cannot be empty`: Mensagem vazia.
- `Session ID is required`: ID da sessão não fornecido.
- `User ID is required`: ID do usuário não fornecido.
- `Failed to communicate with chat service`: Falha na comunicação com o serviço de chat.

**Fontes da Seção**
- [errors.ts](file://backend/services/chat/errors.ts#L1-L14)
- [chat.service.ts](file://backend/services/chat/chat.service.ts#L304-L317)

## Persistência de Conversas
As conversas são persistidas no banco de dados usando o serviço `conversation.service.ts`. Cada conversa tem um histórico armazenado em formato JSONB. O histórico é atualizado a cada nova mensagem.

### Estrutura da Tabela
- `chat_conversations`: Armazena metadados da conversa (título, session_id, is_active).
- `chat_conversation_history`: Armazena o histórico da conversa em formato JSONB.

**Fontes da Seção**
- [conversation.service.ts](file://backend/services/conversation/conversation.service.ts#L12-L273)
- [conversation.types.ts](file://backend/services/conversation/conversation.types.ts#L1-L54)

## Diagrama de Arquitetura
```mermaid
graph TD
A[Frontend<br>conversations-panel.tsx] --> B[/api/chat<br>route.ts]
B --> C[chat.service.ts]
C --> D[N8N Webhook]
D --> E[Processamento com Agente]
E --> D
D --> C
C --> B
B --> A
B --> F[attachments.service.ts]
F --> G[/api/chat/attachments/[id]]
G --> H[Anexo Temporário]
B --> I[conversation.service.ts]
I --> J[Banco de Dados]
```

**Fontes do Diagrama**
- [N8N_SETUP.md](file://docs/N8N_SETUP.md#L5-L39)
- [chat.service.ts](file://backend/services/chat/chat.service.ts#L8-L106)
- [conversation.service.ts](file://backend/services/conversation/conversation.service.ts#L12-L273)
- [attachments.service.ts](file://backend/services/chat/attachments.service.ts#L1-L239)