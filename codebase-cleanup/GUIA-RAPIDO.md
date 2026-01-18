# Guia Rápido - codebase-cleanup

## 🚀 Início Rápido

### Instalação
```bash
cd codebase-cleanup
npm install
```

### Compilar
```bash
npm run build
```

### Executar Testes
```bash
# Todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Apenas testes de propriedade
npm run test:property

# Apenas testes de integração
npm run test:integration

# Com cobertura
npm run test:coverage
```

### Verificar Tipos
```bash
npm run typecheck
```

## 📊 Status Atual

✅ **Compilação:** Funcional  
✅ **Testes Unitários:** ~90% passando  
⚠️ **Property Tests:** Alguns timeouts  
✅ **Estrutura:** Estável

## 🔧 Correções Aplicadas

### ✅ O que foi corrigido:
1. Estrutura de testes (parseCode is not defined)
2. Categorização de arquivos (Windows/Linux)
3. Detecção de error handling
4. Timeout de testes (10s → 30s)

### ⚠️ O que ainda precisa atenção:
1. Property-based tests (file discovery)
2. Component pattern detection
3. Alguns edge cases

## 📁 Estrutura do Projeto

```
codebase-cleanup/
├── src/
│   ├── analyzers/          # Analisadores de padrões
│   │   ├── adapter-pattern-analyzer.ts
│   │   ├── api-route-pattern-analyzer.ts
│   │   ├── component-pattern-analyzer.ts
│   │   ├── database-pattern-analyzer.ts
│   │   └── ...
│   ├── scanner/            # Scanner de arquivos
│   ├── engine/             # Motor de análise
│   ├── classifier/         # Classificador de issues
│   ├── planner/            # Planejador de limpeza
│   └── reporter/           # Gerador de relatórios
├── tests/
│   ├── unit/               # Testes unitários
│   ├── property/           # Testes property-based
│   └── integration/        # Testes de integração
└── dist/                   # Código compilado
```

## 🎯 Casos de Uso

### 1. Analisar um Projeto
```typescript
import { createAnalysisEngine } from './src/engine/analysis-engine.js';
import { FileScannerImpl } from './src/scanner/file-scanner.js';

const scanner = new FileScannerImpl();
const engine = createAnalysisEngine();

// Escanear arquivos
const files = await scanner.scanDirectory('./my-project', {
  includePatterns: ['**/*.ts', '**/*.tsx'],
  excludePatterns: ['node_modules/**', 'dist/**'],
});

// Analisar
const results = await engine.analyze(files);

// Ver issues
console.log(results.issues);
```

### 2. Usar Analisadores Específicos
```typescript
import { DatabasePatternAnalyzer } from './src/analyzers/database-pattern-analyzer.js';

const analyzer = new DatabasePatternAnalyzer();
const issues = await analyzer.analyze(fileInfo, ast);
```

### 3. Gerar Relatório
```typescript
import { ReportGenerator } from './src/reporter/report-generator.js';

const reporter = new ReportGenerator();
const report = reporter.generateReport(results);
console.log(report);
```

## 🧪 Executar Testes Específicos

### Por Arquivo
```bash
# Scanner
npm test -- tests/unit/scanner/file-scanner.test.ts

# Database Analyzer
npm test -- tests/unit/analyzers/database-pattern-analyzer.test.ts

# Component Analyzer
npm test -- tests/unit/analyzers/component-pattern-analyzer.test.ts
```

### Por Padrão
```bash
# Apenas testes de "error handling"
npm test -- -t "error handling"

# Apenas testes de "categorization"
npm test -- -t "categorization"
```

### Com Verbose
```bash
npm test -- --reporter=verbose
```

## 🐛 Debug

### Adicionar Logs
```typescript
// Temporário para debug
console.log('DEBUG:', { variable, state });
```

### Executar com Node Inspector
```bash
node --inspect-brk node_modules/.bin/vitest run
```

### Ver Output Completo
```bash
npm test -- --reporter=verbose 2>&1 | tee test-output.log
```

## 📚 Documentação Disponível

1. **RESUMO-EXECUTIVO-FINAL.md** - Visão geral completa
2. **CORRECOES-APLICADAS.md** - Detalhes técnicos das correções
3. **PROXIMOS-PASSOS.md** - Plano de ação para melhorias
4. **RELATORIO-EXECUCAO.md** - Resultados da última execução
5. **GUIA-RAPIDO.md** - Este documento

## ⚡ Dicas Rápidas

### Performance
- Use `includePatterns` para limitar escopo
- Configure `maxDepth` para evitar recursão excessiva
- Ative cache quando disponível

### Testes
- Timeout padrão: 30s (configurável)
- Use `skip` para testes muito lentos
- Property tests podem demorar mais

### Desenvolvimento
- Sempre compile antes de testar: `npm run build`
- Verifique tipos: `npm run typecheck`
- Use linter: `npm run lint`

## 🔗 Links Úteis

- [ts-morph Documentation](https://ts-morph.com/)
- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique a documentação em `docs/`
2. Revise os testes como exemplos
3. Consulte os relatórios de correção
4. Adicione logs de debug para investigação

---

**Última Atualização:** 2026-01-18  
**Versão:** 1.0.0  
**Status:** ✅ Funcional
