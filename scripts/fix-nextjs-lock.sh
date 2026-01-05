#!/bin/bash

# Script para resolver problemas de lock do Next.js
# Uso: ./scripts/fix-nextjs-lock.sh

echo "🔧 Resolvendo problema de lock do Next.js..."
echo ""

# 1. Verificar processos Node.js rodando
echo "1. Verificando processos Node.js..."
NODE_PROCESSES=$(pgrep -f "node" 2>/dev/null || echo "")

if [ -n "$NODE_PROCESSES" ]; then
    echo "   [AVISO] Encontrados processos Node.js rodando:"
    ps aux | grep -E "node|next" | grep -v grep | awk '{print "   - PID: " $2 " | " $11}'
    echo ""
    echo "   Deseja encerrar esses processos? (s/n)"
    read -r response
    if [ "$response" = "s" ] || [ "$response" = "S" ] || [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        pkill -f "node" 2>/dev/null
        sleep 2
        echo "   [OK] Processos encerrados"
    fi
else
    echo "   [OK] Nenhum processo Node.js encontrado"
fi

echo ""

# 2. Remover arquivo de lock
echo "2. Removendo arquivo de lock..."
LOCK_FILE=".next/dev/lock"

if [ -f "$LOCK_FILE" ]; then
    rm -f "$LOCK_FILE"
    if [ -f "$LOCK_FILE" ]; then
        echo "   [ERRO] Não foi possível remover o lock"
        echo "   Tente fechar manualmente todos os processos Node.js"
    else
        echo "   [OK] Arquivo de lock removido"
    fi
else
    echo "   [OK] Nenhum arquivo de lock encontrado"
fi

echo ""

# 3. Limpar cache do Next.js (opcional)
echo "3. Deseja limpar o cache do Next.js? (s/n)"
read -r response
if [ "$response" = "s" ] || [ "$response" = "S" ] || [ "$response" = "y" ] || [ "$response" = "Y" ]; then
    if [ -d ".next" ]; then
        echo "   Removendo diretório .next..."
        rm -rf .next
        echo "   [OK] Cache limpo"
    fi
fi

echo ""
echo "========================================"
echo "RESUMO"
echo "========================================"
echo ""
echo "[OK] Problema de lock resolvido!"
echo ""
echo "Agora você pode executar:"
echo "  npm run dev"
echo ""






