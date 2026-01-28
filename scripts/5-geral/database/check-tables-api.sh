#!/bin/bash
# Script para verificar tabelas usando a API route
# Requer que você esteja autenticado como superadmin

echo "🔍 Verificando tabelas via API..."
echo ""

# Obter token de autenticação (você precisa estar logado)
# Este script assume que você tem uma sessão ativa
# Se não tiver, faça login primeiro

API_URL="http://localhost:3000/api/superadmin/check-empty-tables"

echo "📡 Fazendo requisição para: $API_URL"
echo ""

response=$(curl -s -w "\n%{http_code}" "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat ~/.cursor/session-cookie 2>/dev/null || echo '')")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo "✅ Resposta recebida:"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo "❌ Erro HTTP $http_code:"
  echo "$body"
  echo ""
  echo "💡 Dica: Certifique-se de estar autenticado como superadmin"
fi




