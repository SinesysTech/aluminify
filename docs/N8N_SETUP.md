# Configuração do n8n para Chat com Agente

Este documento explica como configurar o workflow no n8n para integrar o chat com o agente.

## Arquitetura

1. **Cliente** → Envia mensagem para `/api/chat?stream=true`
2. **Nossa API** → Envia mensagem para o webhook do n8n: `https://webhook.sinesys.app/webhook/013bad97-160b-4f20-9a2b-e9f3fa8bfa52`
3. **n8n** → Processa a mensagem com o agente
4. **n8n** → Envia resposta para `/api/chat/callback` (nosso endpoint)
5. **Nossa API** → Envia resposta para o cliente via streaming

## Endpoint de Callback

**URL:** `https://seu-dominio.com/api/chat/callback` (ou `http://localhost:3000/api/chat/callback` em desenvolvimento)

**Método:** POST

**Headers:**
```
Content-Type: application/json
```

**Body (formato esperado):**

### Opção 1: Resposta Completa (recomendado para respostas curtas)
```json
{
  "sessionId": "session-123456",
  "output": "Resposta completa do agente aqui",
  "isComplete": true
}
```

### Opção 2: Streaming (para respostas longas, enviar múltiplos chunks)
```json
{
  "sessionId": "session-123456",
  "chunk": "Primeiro pedaço da resposta",
  "isComplete": false
}
```

E depois enviar mais chunks:
```json
{
  "sessionId": "session-123456",
  "chunk": "Segundo pedaço da resposta",
  "isComplete": false
}
```

E finalmente:
```json
{
  "sessionId": "session-123456",
  "chunk": "Último pedaço da resposta",
  "isComplete": true
}
```

## Configuração no n8n

### Passo 1: Webhook de Entrada

1. Adicione um nó **Webhook**
2. Configure:
   - **HTTP Method:** POST
   - **Path:** `/webhook/013bad97-160b-4f20-9a2b-e9f3fa8bfa52`
   - **Response Mode:** Respond to Webhook
   - **Response Code:** 200

3. O webhook receberá o seguinte formato:
```json
{
  "input": "mensagem do usuário",
  "ids": {
    "sessionId": "session-123456",
    "userId": "user-789"
  }
}
```

### Passo 2: Processar com o Agente

1. Adicione um nó para processar a mensagem com o agente (pode ser um nó de IA, LLM, ou outro serviço)
2. Use `{{ $json.input }}` para acessar a mensagem do usuário
3. Use `{{ $json.ids.sessionId }}` e `{{ $json.ids.userId }}` para acessar os IDs

### Passo 3: Enviar Resposta para o Callback

1. Adicione um nó **HTTP Request**
2. Configure:
   - **Method:** POST
   - **URL:** `https://seu-dominio.com/api/chat/callback`
     - Em desenvolvimento: `http://localhost:3000/api/chat/callback`
     - Em produção: substitua pelo seu domínio
   - **Authentication:** None (ou configure se necessário)
   - **Send Body:** Yes
   - **Body Content Type:** JSON

3. **Body (JSON):**
```json
{
  "sessionId": "{{ $json.ids.sessionId }}",
  "output": "{{ $json.resposta_do_agente }}",
  "isComplete": true
}
```

**Nota:** Substitua `resposta_do_agente` pelo campo que contém a resposta do seu agente.

### Passo 4: Para Streaming (Opcional)

Se você quiser enviar a resposta em chunks (streaming):

1. Após processar com o agente, use um nó **Split In Batches** ou **Loop Over Items**
2. Para cada chunk, envie uma requisição HTTP para o callback:
   - **URL:** `https://seu-dominio.com/api/chat/callback`
   - **Method:** POST
   - **Body:**
   ```json
   {
     "sessionId": "{{ $json.ids.sessionId }}",
     "chunk": "{{ $json.chunk_atual }}",
     "isComplete": false
   }
   ```
3. No último chunk, defina `isComplete: true`

## Exemplo de Workflow Completo

```
[Webhook] → [Processar Mensagem] → [Agente/LLM] → [HTTP Request (Callback)]
```

### Exemplo com Expressões n8n

**No nó HTTP Request (Callback), use:**

```json
{
  "sessionId": "{{ $('Webhook').item.json.ids.sessionId }}",
  "output": "{{ $json.output }}",
  "isComplete": true
}
```

## Variáveis de Ambiente (Opcional)

Se você quiser usar variáveis de ambiente no n8n:

1. Configure uma variável `CHAT_CALLBACK_URL` no n8n
2. Use no nó HTTP Request: `{{ $env.CHAT_CALLBACK_URL }}/api/chat/callback`

## Testando

### Teste Manual do Callback

Você pode testar o callback diretamente:

```bash
curl -X POST http://localhost:3000/api/chat/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "output": "Esta é uma resposta de teste do agente",
    "isComplete": true
  }'
```

### Verificar Resposta Pendente

```bash
curl http://localhost:3000/api/chat/callback?sessionId=test-session-123
```

## Troubleshooting

### A resposta não aparece no chat

1. Verifique se o `sessionId` enviado no callback é o mesmo usado na requisição original
2. Verifique os logs do servidor para ver se o callback está sendo recebido
3. Verifique se o formato do body está correto (JSON válido)
4. Verifique se a URL do callback está acessível do n8n

### Erro 404 no callback

- Certifique-se de que a URL está correta
- Em desenvolvimento, use `http://localhost:3000`
- Em produção, use o domínio completo com `https://`

### Timeout na resposta

- O sistema aguarda até 2 minutos por uma resposta
- Se o agente demorar mais, considere enviar chunks intermediários com `isComplete: false`

## Logs

O sistema registra logs detalhados:
- `[Chat Callback]` - Logs do endpoint de callback
- `[Chat API]` - Logs do endpoint de streaming
- `[Chat Service]` - Logs do serviço de chat

Verifique os logs do servidor para debug.

