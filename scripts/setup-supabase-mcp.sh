#!/bin/bash

# Script para configurar o MCP do Supabase no Cursor
# Uso: ./scripts/setup-supabase-mcp.sh SEU_ACCESS_TOKEN

if [ -z "$1" ]; then
    echo "❌ Erro: Token de acesso não fornecido"
    echo ""
    echo "Uso: ./scripts/setup-supabase-mcp.sh SEU_ACCESS_TOKEN"
    echo ""
    echo "Para gerar um token:"
    echo "1. Acesse: https://supabase.com/dashboard/account/tokens"
    echo "2. Clique em 'Generate new token'"
    echo "3. Copie o token e use neste script"
    exit 1
fi

ACCESS_TOKEN="$1"
PROJECT_REF="wtqgfmtucqmpheghcvxo"
MCP_FILE="$HOME/.cursor/mcp.json"

echo "🔧 Configurando MCP do Supabase no Cursor..."
echo ""

# Criar backup do arquivo existente
if [ -f "$MCP_FILE" ]; then
    cp "$MCP_FILE" "$MCP_FILE.backup"
    echo "✅ Backup criado: $MCP_FILE.backup"
fi

# Criar/atualizar arquivo mcp.json
cat > "$MCP_FILE" << EOF
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=${PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${ACCESS_TOKEN}"
      }
    }
  }
}
EOF

echo "✅ Arquivo mcp.json atualizado em: $MCP_FILE"
echo ""
echo "📋 Configuração aplicada:"
echo "   - Project Ref: $PROJECT_REF"
echo "   - URL: https://mcp.supabase.com/mcp?project_ref=${PROJECT_REF}"
echo "   - Token: ${ACCESS_TOKEN:0:20}... (oculto)"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Feche completamente o Cursor"
echo "   2. Abra o Cursor novamente"
echo "   3. O MCP do Supabase deve estar disponível"
echo ""










