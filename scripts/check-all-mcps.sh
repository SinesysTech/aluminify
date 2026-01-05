#!/bin/bash

# Script para verificar status de todos os MCPs
# Uso: ./scripts/check-all-mcps.sh

echo "🔍 Verificando configuração dos MCPs..."
echo ""

# Verificar arquivo mcp.json no diretório do projeto
PROJECT_MCP=".cursor/mcp.json"
USER_MCP="$HOME/.cursor/mcp.json"
WINDOWS_MCP="/c/Users/$USER/.cursor/mcp.json"

MCP_FILE=""
MCP_LOCATION=""

# Verificar qual arquivo existe
if [ -f "$PROJECT_MCP" ]; then
    MCP_FILE="$PROJECT_MCP"
    MCP_LOCATION="projeto (.cursor/mcp.json)"
elif [ -f "$USER_MCP" ]; then
    MCP_FILE="$USER_MCP"
    MCP_LOCATION="usuario ($USER_MCP)"
elif [ -f "$WINDOWS_MCP" ]; then
    MCP_FILE="$WINDOWS_MCP"
    MCP_LOCATION="Windows ($WINDOWS_MCP)"
fi

if [ -z "$MCP_FILE" ]; then
    echo "❌ [ERRO] Nenhum arquivo mcp.json encontrado"
    echo ""
    echo "Locais verificados:"
    echo "  - $PROJECT_MCP"
    echo "  - $USER_MCP"
    echo "  - $WINDOWS_MCP"
    echo ""
    echo "📋 Nenhum MCP está configurado!"
    exit 1
fi

echo "✅ [OK] Arquivo mcp.json encontrado: $MCP_LOCATION"
echo ""

# Ler o conteúdo do arquivo
MCP_CONTENT=$(cat "$MCP_FILE" 2>/dev/null)

# Verificar Supabase
echo "1. MCP do Supabase:"
if echo "$MCP_CONTENT" | grep -q "supabase" 2>/dev/null; then
    echo "   ✅ [OK] Configurado"
    if echo "$MCP_CONTENT" | grep -q "project_ref" 2>/dev/null; then
        PROJECT_REF=$(echo "$MCP_CONTENT" | grep -o "project_ref=[^&\"']*" | cut -d= -f2 | head -1)
        if [ -n "$PROJECT_REF" ]; then
            echo "   📋 Project Ref: $PROJECT_REF"
        fi
    fi
    if echo "$MCP_CONTENT" | grep -q "Authorization" 2>/dev/null; then
        echo "   🔑 Token: Configurado (oculto)"
    fi
else
    echo "   ❌ [ERRO] NÃO configurado"
fi
echo ""

# Verificar Shadcn
echo "2. MCP do Shadcn:"
if echo "$MCP_CONTENT" | grep -qi "shadcn" 2>/dev/null; then
    echo "   ✅ [OK] Configurado"
else
    echo "   ❌ [ERRO] NÃO configurado"
fi
echo ""

# Verificar se o arquivo está vazio
if echo "$MCP_CONTENT" | grep -q '"mcpServers":\s*{}' 2>/dev/null || [ -z "$(echo "$MCP_CONTENT" | grep -v '^[[:space:]]*$' | grep -v '^[[:space:]]*//')" ]; then
    echo "⚠️  [AVISO] Arquivo mcp.json existe mas está vazio"
    echo "   Nenhum MCP está configurado!"
    echo ""
fi

echo "========================================"
echo "RESUMO"
echo "========================================"
echo ""

SUPABASE_OK=$(echo "$MCP_CONTENT" | grep -q "supabase" 2>/dev/null && echo "sim" || echo "nao")
SHADCN_OK=$(echo "$MCP_CONTENT" | grep -qi "shadcn" 2>/dev/null && echo "sim" || echo "nao")

if [ "$SUPABASE_OK" = "sim" ] && [ "$SHADCN_OK" = "sim" ]; then
    echo "✅ Ambos os MCPs estão configurados!"
elif [ "$SUPABASE_OK" = "sim" ]; then
    echo "✅ MCP do Supabase: Configurado"
    echo "❌ MCP do Shadcn: NÃO configurado"
elif [ "$SHADCN_OK" = "sim" ]; then
    echo "❌ MCP do Supabase: NÃO configurado"
    echo "✅ MCP do Shadcn: Configurado"
else
    echo "❌ Nenhum MCP está configurado!"
fi

echo ""
echo "📋 Para configurar:"
if [ "$SUPABASE_OK" = "nao" ]; then
    echo "   - Supabase: ./scripts/setup-supabase-mcp.sh SEU_TOKEN"
fi
if [ "$SHADCN_OK" = "nao" ]; then
    echo "   - Shadcn: Consulte https://www.shadcn.io/mcp/cursor"
fi
echo ""





