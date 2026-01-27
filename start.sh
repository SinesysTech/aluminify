#!/bin/sh
# Aluminify - Script de inicialização para Next.js + Mastra
# Next.js: porta 3000 | Mastra Studio: porta 4111

set -e

echo "Starting Aluminify services..."

# Iniciar Mastra Server/Studio em background
if [ -f ".mastra/output/index.mjs" ]; then
  echo "Starting Mastra Studio on port 4111..."
  node .mastra/output/index.mjs &
  MASTRA_PID=$!
  echo "Mastra started with PID: $MASTRA_PID"
else
  echo "Warning: Mastra build not found, skipping..."
fi

# Iniciar Next.js em foreground (processo principal)
echo "Starting Next.js on port 3000..."
exec npm start
