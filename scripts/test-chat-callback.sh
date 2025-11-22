#!/bin/bash

# Script para testar o callback do chat manualmente
# Simula o N8N enviando uma resposta para o sistema

echo "=========================================="
echo "Testando callback do chat com N8N"
echo "=========================================="
echo ""

# 1. Testar callback com resposta completa
echo "1. Enviando resposta completa via callback..."
SESSION_ID="test-session-$(date +%s)"
echo "SessionId: $SESSION_ID"
echo ""

curl -X POST http://localhost:3001/api/chat/callback \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"output\": \"Esta é uma resposta de teste do agente N8N.\",
    \"isComplete\": true
  }" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "=========================================="
echo ""

# 2. Verificar se a resposta foi armazenada
echo "2. Verificando se a resposta foi armazenada..."
curl -X GET "http://localhost:3001/api/chat/callback?sessionId=$SESSION_ID" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "=========================================="
echo ""

# 3. Testar callback com chunks (streaming)
echo "3. Testando streaming com múltiplos chunks..."
SESSION_ID_2="test-session-$(date +%s)-streaming"
echo "SessionId: $SESSION_ID_2"
echo ""

# Primeiro chunk
echo "Enviando chunk 1..."
curl -X POST http://localhost:3001/api/chat/callback \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID_2\",
    \"chunk\": \"Esta é a primeira parte \",
    \"isComplete\": false
  }" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""

# Segundo chunk
echo "Enviando chunk 2..."
curl -X POST http://localhost:3001/api/chat/callback \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID_2\",
    \"chunk\": \"da resposta do agente. \",
    \"isComplete\": false
  }" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""

# Último chunk
echo "Enviando chunk 3 (final)..."
curl -X POST http://localhost:3001/api/chat/callback \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID_2\",
    \"chunk\": \"Teste de streaming concluído!\",
    \"isComplete\": true
  }" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""

# Verificar resposta completa
echo "Verificando resposta completa no Redis..."
curl -X GET "http://localhost:3001/api/chat/callback?sessionId=$SESSION_ID_2" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "=========================================="
echo "Teste concluído!"
echo "=========================================="
echo ""
echo "OBSERVAÇÕES:"
echo "- Verifique os logs do servidor para ver as mensagens do Response Store"
echo "- Se você ver '[Response Store] ✅ Upstash Redis configurado', o Redis está funcionando"
echo "- Se você ver '[Response Store] ⚠️ Map em memória', o Redis não está configurado"
echo ""
