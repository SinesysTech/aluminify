#!/bin/bash

# Script para verificar se o MCP do Supabase está configurado
# Uso: ./scripts/check-mcp-supabase.sh

echo "🔍 Verificando configuração do MCP do Supabase..."
echo ""

# Tentar diferentes caminhos possíveis
MCP_PATHS=(
    "$HOME/.cursor/mcp.json"
    "$USERPROFILE/.cursor/mcp.json"
    "/c/Users/$USER/.cursor/mcp.json"
    "$(eval echo ~)/.cursor/mcp.json"
)

MCP_FILE=""
for path in "${MCP_PATHS[@]}"; do
    if [ -f "$path" ]; then
        MCP_FILE="$path"
        break
    fi
done

if [ -z "$MCP_FILE" ]; then
    echo "❌ [ERRO] Arquivo mcp.json não encontrado"
    echo ""
    echo "O arquivo deveria estar em um destes locais:"
    for path in "${MCP_PATHS[@]}"; do
        echo "  - $path"
    done
    echo ""
    echo "📋 Para configurar o MCP do Supabase:"
    echo "   1. Gere um token: https://supabase.com/dashboard/account/tokens"
    echo "   2. Execute: ./scripts/setup-supabase-mcp.sh SEU_TOKEN"
    echo "   Ou (PowerShell): .\scripts\setup-supabase-mcp.ps1 -AccessToken SEU_TOKEN"
    echo ""
    exit 1
fi

echo "✅ [OK] Arquivo mcp.json encontrado: $MCP_FILE"
echo ""

# Verificar se contém configuração do Supabase
if grep -q "supabase" "$MCP_FILE" 2>/dev/null; then
    echo "✅ [OK] MCP do Supabase encontrado na configuração"
    echo ""
    
    # Tentar extrair informações (sem mostrar o token completo)
    if grep -q "project_ref" "$MCP_FILE"; then
        PROJECT_REF=$(grep -o "project_ref=[^&\"']*" "$MCP_FILE" | cut -d= -f2 | head -1)
        if [ -n "$PROJECT_REF" ]; then
            echo "   📋 Project Ref: $PROJECT_REF"
        fi
    fi
    
    if grep -q "Authorization" "$MCP_FILE"; then
        TOKEN_PREVIEW=$(grep -o "Bearer [^\"']*" "$MCP_FILE" | cut -d' ' -f2 | cut -c1-20)
        if [ -n "$TOKEN_PREVIEW" ]; then
            echo "   🔑 Token: ${TOKEN_PREVIEW}... (oculto)"
        fi
    fi
    
    echo ""
    echo "✅ [OK] MCP do Supabase está configurado!"
    echo ""
    echo "🔄 Para verificar se está funcionando:"
    echo "   1. Feche completamente o Cursor"
    echo "   2. Abra o Cursor novamente"
    echo "   3. No chat do Cursor, tente usar comandos relacionados ao Supabase"
    echo "   4. O MCP deve aparecer na lista de recursos disponíveis"
    echo ""
    exit 0
else
    echo "⚠️  [AVISO] Arquivo mcp.json existe mas não contém configuração do Supabase"
    echo ""
    echo "📋 Para configurar:"
    echo "   1. Gere um token: https://supabase.com/dashboard/account/tokens"
    echo "   2. Execute: ./scripts/setup-supabase-mcp.sh SEU_TOKEN"
    echo ""
    exit 1
fi





