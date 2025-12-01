# Configuração do N8N para Chat com Agente

Este documento explica como configurar o workflow no N8N para integrar o chat com o agente.

## Arquitetura Simplificada

```
┌─────────────┐
│   Cliente   │
│  (TobIAs)   │
└──────┬──────┘
       │ POST /api/chat
       │ { message, sessionId, userId }
       ▼
┌─────────────────────────────────────┐
│  API Route (chat/route.ts)          │
│  - Valida requisição                │
│  - Envia para N8N webhook           │
│  - Aguarda resposta                 │
│  - Retorna JSON                     │
└──────┬──────────────────────────────┘
       │
       │ POST webhook N8N
       │ { input, ids }
       ▼
┌─────────────────────────────────────┐
│         N8N Workflow                │
│  - Processa com agente              │
│  - Gera resposta                    │
│  - Retorna resposta                 │
└──────┬──────────────────────────────┘
       │
       │ Response JSON
       │ [{ "output": "resposta" }]
       ▼
┌─────────────────────────────────────┐
│  Cliente (TobIAs)                   │
│  - Renderiza resposta               │
└─────────────────────────────────────┘
```

## Configuração no N8N

### Webhook de Entrada

1. Adicione um nó **Webhook**
2. Configure:
   - **HTTP Method:** POST
   - **Path:** `/webhook/83afbb4f-6f9f-410d-aa17-7e3e301e2db6/chat`
   - **Response Mode:** Respond to Webhook (IMPORTANTE!)
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

### Processar com o Agente

1. Adicione seu nó de processamento (IA, LLM, etc.)
2. Use `{{ $json.input }}` para acessar a mensagem do usuário  
3. Use `{{ $json.ids.sessionId }}` e `{{ $json.ids.userId }}` para acessar os IDs

### Resposta do Webhook

**IMPORTANTE:** Configure o webhook para retornar a resposta diretamente.

**Formato esperado:**
```json
[
  {
    "output": "Resposta do agente aqui"
  }
]
```

Ou apenas:
```json
{
  "output": "Resposta do agente aqui"  
}
```

## Testando

### Teste Manual do Webhook

```bash
curl -X POST https://webhook.sinesys.app/webhook/83afbb4f-6f9f-410d-aa17-7e3e301e2db6/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Olá, como você está?",
    "ids": {
      "sessionId": "test-session-123",
      "userId": "test-user-456"
    }
  }'
```

## Resumo

1. **Webhook N8N** → Recebe POST com `{ input, ids }`
2. **Processa** → Agente gera resposta  
3. **Retorna** → `{ output: "resposta" }`
4. **Cliente** → Renderiza resposta

**É isso!** Simples, direto e funcional. 🚀
