#!/usr/bin/env node
/**
 * Script para adicionar imports React faltantes
 * Corrige o problema crítico de 125 arquivos sem import React
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

let filesFixed = 0;
let filesScanned = 0;

function hasReactUsage(content) {
  const reactPatterns = [
    /'use client'/,
    /"use client"/,
    /useState/,
    /useEffect/,
    /useCallback/,
    /useMemo/,
    /useRef/,
    /useContext/,
    /useReducer/,
    /useLayoutEffect/,
  ];
  
  return reactPatterns.some(pattern => pattern.test(content));
}

function hasReactImport(content) {
  return /import\s+(?:React|\{[^}]*\})\s+from\s+['"]react['"]/.test(content);
}

function addReactImport(content) {
  // Detecta quais hooks estão sendo usados
  const hooks = [];
  if (/useState/.test(content)) hooks.push('useState');
  if (/useEffect/.test(content)) hooks.push('useEffect');
  if (/useCallback/.test(content)) hooks.push('useCallback');
  if (/useMemo/.test(content)) hooks.push('useMemo');
  if (/useRef/.test(content)) hooks.push('useRef');
  if (/useContext/.test(content)) hooks.push('useContext');
  if (/useReducer/.test(content)) hooks.push('useReducer');
  if (/useLayoutEffect/.test(content)) hooks.push('useLayoutEffect');
  
  // Cria o import statement
  const importStatement = hooks.length > 0
    ? `import { ${hooks.join(', ')} } from 'react'\n`
    : `import React from 'react'\n`;
  
  // Encontra onde inserir (após 'use client' se existir)
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Procura por 'use client' ou 'use server'
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("'use client'") || lines[i].includes('"use client"') ||
        lines[i].includes("'use server'") || lines[i].includes('"use server"')) {
      insertIndex = i + 1;
      break;
    }
  }
  
  // Insere o import
  lines.splice(insertIndex, 0, importStatement);
  
  return lines.join('\n');
}

function processFile(filePath) {
  filesScanned++;
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Verifica se precisa de correção
    if (hasReactUsage(content) && !hasReactImport(content)) {
      const fixed = addReactImport(content);
      writeFileSync(filePath, fixed, 'utf-8');
      filesFixed++;
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
  
  return false;
}

function scanDirectory(dir, excludeDirs = ['node_modules', '.next', 'dist', '.git']) {
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      if (excludeDirs.includes(entry)) continue;
      
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, excludeDirs);
      } else if (entry.endsWith('.tsx')) {
        processFile(fullPath);
      }
    }
  } catch (_error) {
    // Ignora erros de acesso
  }
}

// Execução
console.log('🔧 Iniciando correção de imports React...\n');

const targetDirs = ['app', 'components'];

for (const dir of targetDirs) {
  console.log(`📁 Processando ${dir}/...`);
  scanDirectory(dir);
}

console.log('\n' + '='.repeat(50));
console.log(`📊 Resumo:`);
console.log(`   Arquivos escaneados: ${filesScanned}`);
console.log(`   Arquivos corrigidos: ${filesFixed}`);
console.log('='.repeat(50));

if (filesFixed > 0) {
  console.log('\n✅ Correções aplicadas com sucesso!');
  console.log('💡 Recomendação: Execute os testes para verificar se tudo está funcionando.');
} else {
  console.log('\n✅ Nenhuma correção necessária!');
}
