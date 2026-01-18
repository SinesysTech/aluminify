/**
 * Quick Analysis Script
 * Análise rápida focada em problemas comuns sem AST pesado
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface Issue {
  file: string;
  line: number;
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

const issues: Issue[] = [];

// Padrões a detectar
const patterns = {
  // React sem import
  reactWithoutImport: /['"]use client['"]|useState|useEffect|useCallback|useMemo/,
  reactImport: /import\s+(?:React|\{[^}]*\})\s+from\s+['"]react['"]/,
  
  // Erros comuns
  anyType: /:\s*any\b/,
  consoleLog: /console\.(log|debug|info)\(/,
  todoComment: /\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*HACK/,
  emptyTryCatch: /catch\s*\([^)]*\)\s*\{\s*\}/,
  
  // Problemas de importação
  missingModuleResolution: /Cannot find module/,
  
  // Type safety
  unknownType: /:\s*unknown\b/,
  propertyNotExist: /Property .* does not exist/,
};

function analyzeFile(filePath: string, projectRoot: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = relative(projectRoot, filePath);
    
    // Verifica React sem import
    const hasReactUsage = patterns.reactWithoutImport.test(content);
    const hasReactImport = patterns.reactImport.test(content);
    
    if (hasReactUsage && !hasReactImport && filePath.endsWith('.tsx')) {
      issues.push({
        file: relativePath,
        line: 1,
        type: 'missing-react-import',
        severity: 'high',
        message: 'React usado mas não importado (pode causar erro em produção)'
      });
    }
    
    // Analisa linha por linha
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Detecta uso de 'any'
      if (patterns.anyType.test(line)) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'type-safety',
          severity: 'medium',
          message: 'Uso de tipo "any" - reduz type safety'
        });
      }
      
      // Detecta console.log
      if (patterns.consoleLog.test(line)) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'debug-code',
          severity: 'low',
          message: 'Console.log deixado no código'
        });
      }
      
      // Detecta TODOs
      if (patterns.todoComment.test(line)) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'incomplete-code',
          severity: 'low',
          message: 'Código incompleto (TODO/FIXME/HACK)'
        });
      }
      
      // Detecta try-catch vazio
      if (patterns.emptyTryCatch.test(line)) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'error-handling',
          severity: 'high',
          message: 'Bloco catch vazio - erros sendo silenciados'
        });
      }
      
      // Detecta unknown type
      if (patterns.unknownType.test(line) && !line.includes('Record<string, unknown>')) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'type-safety',
          severity: 'medium',
          message: 'Uso de tipo "unknown" sem type guard'
        });
      }
    });
    
  } catch (error) {
    // Ignora erros de leitura
  }
}

function scanDirectory(dir: string, projectRoot: string, maxFiles: number = 100): void {
  if (issues.length >= maxFiles * 5) return; // Limita issues
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      
      // Ignora node_modules, .next, etc
      if (entry === 'node_modules' || entry === '.next' || entry === 'dist' || 
          entry === '.git' || entry === 'coverage') {
        continue;
      }
      
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, projectRoot, maxFiles);
      } else if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
        analyzeFile(fullPath, projectRoot);
      }
    }
  } catch (error) {
    // Ignora erros de acesso
  }
}

function generateReport(): string {
  const byType = new Map<string, Issue[]>();
  const bySeverity = new Map<string, Issue[]>();
  
  issues.forEach(issue => {
    // Por tipo
    if (!byType.has(issue.type)) {
      byType.set(issue.type, []);
    }
    byType.get(issue.type)!.push(issue);
    
    // Por severidade
    if (!bySeverity.has(issue.severity)) {
      bySeverity.set(issue.severity, []);
    }
    bySeverity.get(issue.severity)!.push(issue);
  });
  
  let report = '# Análise Rápida de Qualidade de Código\n\n';
  report += `**Total de Issues:** ${issues.length}\n\n`;
  
  // Resumo por severidade
  report += '## Resumo por Severidade\n\n';
  report += `- 🔴 **High:** ${bySeverity.get('high')?.length || 0}\n`;
  report += `- 🟡 **Medium:** ${bySeverity.get('medium')?.length || 0}\n`;
  report += `- 🟢 **Low:** ${bySeverity.get('low')?.length || 0}\n\n`;
  
  // Resumo por tipo
  report += '## Resumo por Tipo\n\n';
  Array.from(byType.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([type, typeIssues]) => {
      report += `- **${type}:** ${typeIssues.length} ocorrências\n`;
    });
  
  report += '\n## Top 20 Issues Críticos\n\n';
  
  const criticalIssues = issues
    .filter(i => i.severity === 'high')
    .slice(0, 20);
  
  if (criticalIssues.length === 0) {
    report += '*Nenhum issue crítico encontrado!* ✅\n\n';
  } else {
    criticalIssues.forEach((issue, index) => {
      report += `### ${index + 1}. ${issue.type}\n`;
      report += `- **Arquivo:** \`${issue.file}:${issue.line}\`\n`;
      report += `- **Severidade:** ${issue.severity}\n`;
      report += `- **Mensagem:** ${issue.message}\n\n`;
    });
  }
  
  // Detalhes por tipo
  report += '## Detalhes por Tipo de Issue\n\n';
  
  Array.from(byType.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([type, typeIssues]) => {
      report += `### ${type} (${typeIssues.length} ocorrências)\n\n`;
      
      // Mostra até 10 exemplos
      typeIssues.slice(0, 10).forEach(issue => {
        report += `- \`${issue.file}:${issue.line}\` - ${issue.message}\n`;
      });
      
      if (typeIssues.length > 10) {
        report += `\n*... e mais ${typeIssues.length - 10} ocorrências*\n`;
      }
      
      report += '\n';
    });
  
  return report;
}

// Execução
const targetDir = process.argv[2] || '../app';
const projectRoot = process.argv[3] || '..';

console.log('🔍 Iniciando análise rápida...');
console.log(`📁 Diretório: ${targetDir}\n`);

const startTime = Date.now();
scanDirectory(targetDir, projectRoot);
const duration = Date.now() - startTime;

console.log(`✅ Análise concluída em ${duration}ms`);
console.log(`📊 Total de issues encontrados: ${issues.length}\n`);

const report = generateReport();
console.log(report);

// Salva relatório
import { writeFileSync } from 'fs';
const outputPath = join(projectRoot, 'reports', 'quick-analysis.md');
try {
  writeFileSync(outputPath, report);
  console.log(`\n💾 Relatório salvo em: ${outputPath}`);
} catch (error) {
  console.log('\n⚠️  Não foi possível salvar o relatório');
}
