#!/bin/sh
# Aluminify - Script de inicialização para Next.js
# Next.js: porta 3000

set -e

echo "Starting Aluminify services..."



# Iniciar Next.js em foreground (processo principal)
echo "Starting Next.js on port 3000..."
exec npm start
