#!/bin/bash

# Script para configurar o MCP do Shadcn no Cursor
# Uso: ./scripts/setup-shadcn-mcp.sh

echo "🔧 Configurando MCP do Shadcn no Cursor..."
echo ""

# Tentar encontrar o arquivo mcp.json
PROJECT_MCP=".cursor/mcp.json"
USER_MCP="$HOME/.cursor/mcp.json"
WINDOWS_MCP="/c/Users/$USER/.cursor/mcp.json"

MCP_FILE=""

if [ -f "$PROJECT_MCP" ]; then
    MCP_FILE="$PROJECT_MCP"
elif [ -f "$USER_MCP" ]; then
    MCP_FILE="$USER_MCP"
elif [ -f "$WINDOWS_MCP" ]; then
    MCP_FILE="$WINDOWS_MCP"
else
    # Criar no diretório do projeto
    mkdir -p .cursor
    MCP_FILE="$PROJECT_MCP"
fi

# Criar backup
if [ -f "$MCP_FILE" ]; then
    cp "$MCP_FILE" "$MCP_FILE.backup"
    echo "✅ Backup criado: $MCP_FILE.backup"
fi

# Ler configuração existente ou criar nova
if [ -f "$MCP_FILE" ] && [ -s "$MCP_FILE" ]; then
    # Arquivo existe e não está vazio, vamos adicionar shadcn
    echo "📝 Adicionando MCP do Shadcn à configuração existente..."
    
    # Usar Python ou Node.js para atualizar o JSON (se disponível)
    if command -v python3 &> /dev/null; then
        python3 << EOF
import json
import sys

try:
    with open("$MCP_FILE", 'r') as f:
        config = json.load(f)
except:
    config = {"mcpServers": {}}

if "mcpServers" not in config:
    config["mcpServers"] = {}

config["mcpServers"]["shadcn"] = {
    "command": "npx",
    "args": ["-y", "@shadcn/mcp"]
}

with open("$MCP_FILE", 'w') as f:
    json.dump(config, f, indent=2)
EOF
        echo "✅ Configuração atualizada"
    else
        echo "⚠️  Python3 não encontrado. Criando configuração manual..."
        cat > "$MCP_FILE" << 'EOF'
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "@shadcn/mcp"]
    }
  }
}
EOF
        echo "✅ Configuração criada"
    fi
else
    # Criar nova configuração
    echo "📝 Criando nova configuração..."
    cat > "$MCP_FILE" << 'EOF'
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "@shadcn/mcp"]
    }
  }
}
EOF
    echo "✅ Configuração criada"
fi

echo ""
echo "✅ Arquivo mcp.json atualizado em: $MCP_FILE"
echo ""
echo "📋 Configuração aplicada:"
echo "   - MCP: Shadcn"
echo "   - Comando: npx -y @shadcn/mcp"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Feche completamente o Cursor"
echo "   2. Abra o Cursor novamente"
echo "   3. O MCP do Shadcn deve estar disponível"
echo ""
echo "📚 Documentação: https://www.shadcn.io/mcp/cursor"
echo ""





