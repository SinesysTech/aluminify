# Exemplos de Uso - Codebase Cleanup Analyzer

## 📚 Guia Completo de Uso

### Instalação e Setup

```bash
# 1. Navegar para o diretório do analyzer
cd codebase-cleanup

# 2. Instalar dependências
npm install

# 3. Compilar o projeto
npm run build

# 4. Verificar instalação
node dist/cli/index.js --version
```

---

## 🎯 Casos de Uso Comuns

### Caso 1: Análise Rápida de um Diretório

**Objetivo**: Analisar rapidamente uma pasta específica

```bash
# Analisar apenas backend/services
node dist/cli/index.js analyze \
  --path ../backend/services \
  --output ../reports/backend-analysis \
  --format markdown

# Resultado: reports/backend-analysis.md
```

**Quando usar**: 
- Verificação rápida de uma feature
- Análise de código novo
- Code review automatizado

---

### Caso 2: Análise Completa com Filtros

**Objetivo**: Analisar todo o projeto excluindo pastas desnecessárias

```bash
node dist/cli/index.js analyze \
  --path .. \
  --include "**/*.ts,**/*.tsx" \
  --exclude "**/node_modules/**,**/.next/**,**/dist/**,**/build/**,**/.git/**,**/codebase-cleanup/**" \
  --output ../reports/full-analysis \
  --format both
```

**Resultado**: 
- `reports/full-analysis.md` (para leitura)
- `reports/full-analysis.json` (para processamento)

**Quando usar**:
- Análise completa do projeto
- Antes de releases importantes
- Auditoria de código

---

### Caso 3: Análise Focada em Componentes React

**Objetivo**: Analisar apenas componentes React

```bash
node dist/cli/index.js analyze \
  --path ../components \
  --include "**/*.tsx" \
  --output ../reports/components-analysis \
  --format markdown
```

**Quando usar**:
- Refatoração de UI
- Análise de padrões de componentes
- Verificação de props drilling

---

### Caso 4: Análise de API Routes

**Objetivo**: Verificar qualidade das rotas de API

```bash
node dist/cli/index.js analyze \
  --path ../app/api \
  --output ../reports/api-analysis \
  --format both
```

**Quando usar**:
- Auditoria de segurança
- Verificação de tratamento de erros
- Análise de performance

---

### Caso 5: Análise Incremental (Apenas Arquivos Modificados)

**Objetivo**: Analisar apenas arquivos que mudaram recentemente

```bash
# 1. Obter lista de arquivos modificados
git diff --name-only main...HEAD | grep -E '\.(ts|tsx)$' > changed-files.txt

# 2. Criar script de análise
cat > analyze-changed.sh << 'EOF'
#!/bin/bash
while IFS= read -r file; do
  if [ -f "$file" ]; then
    echo "Analyzing: $file"
    node codebase-cleanup/dist/cli/index.js analyze \
      --path "$file" \
      --output "reports/$(basename $file .ts)-analysis" \
      --format markdown
  fi
done < changed-files.txt
EOF

chmod +x analyze-changed.sh
./analyze-changed.sh
```

**Quando usar**:
- CI/CD pipelines
- Pre-commit hooks
- Code review automatizado

---

## 🔧 Configurações Avançadas

### Aumentar Memória para Projetos Grandes

```bash
# Aumentar heap size do Node.js
node --max-old-space-size=8192 dist/cli/index.js analyze \
  --path ../app \
  --output ../reports/large-analysis \
  --format markdown
```

### Análise com Timeout Customizado

```bash
# Adicionar timeout de 5 minutos
timeout 300 node dist/cli/index.js analyze \
  --path ../backend \
  --output ../reports/backend-analysis \
  --format markdown
```

### Análise Paralela de Múltiplos Diretórios

```bash
#!/bin/bash
# analyze-parallel.sh

# Função para analisar um diretório
analyze_dir() {
  local dir=$1
  local name=$(basename $dir)
  echo "Analyzing $dir..."
  node codebase-cleanup/dist/cli/index.js analyze \
    --path "$dir" \
    --output "reports/${name}-analysis" \
    --format both &
}

# Analisar múltiplos diretórios em paralelo
analyze_dir "backend/services"
analyze_dir "app/api"
analyze_dir "components"
analyze_dir "lib"

# Aguardar todas as análises terminarem
wait

echo "All analyses complete!"
```

---

## 📊 Interpretando os Resultados

### Estrutura do Relatório Markdown

```markdown
# Codebase Analysis Report

## Summary
- Total Files: 106
- Total Issues: 245
- Critical: 12
- High: 45
- Medium: 123
- Low: 65

## Issues by Category
### Type Safety (High Priority)
- File: backend/services/atividade/atividade.repository-helper.ts
- Line: 45
- Issue: Property 'nome' does not exist on type 'unknown'
- Recommendation: Add type assertion or type guard

### Module Resolution (High Priority)
- File: app/(dashboard)/admin/alunos/page.tsx
- Line: 3
- Issue: Cannot find module '@/lib/server'
- Recommendation: Check tsconfig.json paths configuration
```

### Estrutura do Relatório JSON

```json
{
  "summary": {
    "totalFiles": 106,
    "totalIssues": 245,
    "analyzedAt": "2026-01-18T10:30:00Z",
    "analysisDuration": 45000
  },
  "issuesBySeverity": {
    "critical": [
      {
        "id": "uuid-1",
        "type": "type-safety",
        "severity": "critical",
        "file": "backend/services/atividade/atividade.repository-helper.ts",
        "line": 45,
        "column": 12,
        "message": "Property 'nome' does not exist on type 'unknown'",
        "recommendation": "Add type assertion or type guard",
        "codeSnippet": "const nome = data.nome;"
      }
    ],
    "high": [...],
    "medium": [...],
    "low": [...]
  },
  "patterns": [
    {
      "patternName": "Missing Type Guards",
      "occurrences": 23,
      "files": ["file1.ts", "file2.ts"],
      "severity": "high"
    }
  ]
}
```

---

## 🔄 Integração com CI/CD

### GitHub Actions

```yaml
# .github/workflows/code-quality.yml
name: Code Quality Analysis

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  analyze:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          npm install
          cd codebase-cleanup && npm install && npm run build
          
      - name: Run code analysis
        run: |
          cd codebase-cleanup
          node dist/cli/index.js analyze \
            --path .. \
            --include "**/*.ts,**/*.tsx" \
            --exclude "**/node_modules/**,**/.next/**" \
            --output ../reports/ci-analysis \
            --format json
            
      - name: Check for critical issues
        run: |
          CRITICAL=$(jq '.issuesBySeverity.critical | length' reports/ci-analysis.json)
          if [ "$CRITICAL" -gt 0 ]; then
            echo "Found $CRITICAL critical issues!"
            exit 1
          fi
          
      - name: Upload analysis report
        uses: actions/upload-artifact@v3
        with:
          name: code-analysis-report
          path: reports/ci-analysis.*
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running code quality analysis..."

# Obter arquivos staged
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

if [ -z "$STAGED_FILES" ]; then
  echo "No TypeScript files to analyze"
  exit 0
fi

# Criar arquivo temporário com lista de arquivos
echo "$STAGED_FILES" > /tmp/staged-files.txt

# Analisar arquivos staged
cd codebase-cleanup
CRITICAL_COUNT=0

while IFS= read -r file; do
  if [ -f "../$file" ]; then
    echo "Analyzing: $file"
    node dist/cli/index.js analyze \
      --path "../$file" \
      --output "/tmp/analysis-$(basename $file)" \
      --format json
    
    # Contar issues críticos
    if [ -f "/tmp/analysis-$(basename $file).json" ]; then
      COUNT=$(jq '.issuesBySeverity.critical | length' "/tmp/analysis-$(basename $file).json")
      CRITICAL_COUNT=$((CRITICAL_COUNT + COUNT))
    fi
  fi
done < /tmp/staged-files.txt

cd ..

# Verificar se há issues críticos
if [ $CRITICAL_COUNT -gt 0 ]; then
  echo "❌ Found $CRITICAL_COUNT critical issues!"
  echo "Please fix critical issues before committing."
  echo "Run 'npm run analyze' for detailed report."
  exit 1
fi

echo "✅ Code quality check passed!"
exit 0
```

---

## 📈 Métricas e Monitoramento

### Script de Monitoramento Contínuo

```bash
#!/bin/bash
# monitor-quality.sh

# Configuração
REPORT_DIR="reports/history"
mkdir -p "$REPORT_DIR"

# Data atual
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%s)

# Executar análise
cd codebase-cleanup
node dist/cli/index.js analyze \
  --path .. \
  --include "**/*.ts,**/*.tsx" \
  --exclude "**/node_modules/**,**/.next/**" \
  --output "../$REPORT_DIR/analysis-$DATE" \
  --format json

cd ..

# Extrair métricas
TOTAL_ISSUES=$(jq '.summary.totalIssues' "$REPORT_DIR/analysis-$DATE.json")
CRITICAL=$(jq '.issuesBySeverity.critical | length' "$REPORT_DIR/analysis-$DATE.json")
HIGH=$(jq '.issuesBySeverity.high | length' "$REPORT_DIR/analysis-$DATE.json")

# Salvar métricas
echo "$TIMESTAMP,$TOTAL_ISSUES,$CRITICAL,$HIGH" >> "$REPORT_DIR/metrics.csv"

# Gerar gráfico de tendência (requer gnuplot)
gnuplot << EOF
set terminal png size 800,600
set output '$REPORT_DIR/trend.png'
set datafile separator ','
set xlabel 'Date'
set ylabel 'Issues'
set title 'Code Quality Trend'
set xdata time
set timefmt '%s'
set format x '%Y-%m-%d'
plot '$REPORT_DIR/metrics.csv' using 1:2 with lines title 'Total Issues', \
     '' using 1:3 with lines title 'Critical', \
     '' using 1:4 with lines title 'High'
EOF

echo "Metrics saved to $REPORT_DIR/metrics.csv"
echo "Trend chart saved to $REPORT_DIR/trend.png"
```

---

## 🎓 Melhores Práticas

### 1. Análise Regular

```bash
# Adicionar ao crontab para análise diária
0 2 * * * cd /path/to/project && ./monitor-quality.sh
```

### 2. Análise por Feature

```bash
# Criar branch de análise
git checkout -b analysis/feature-x

# Analisar apenas arquivos da feature
node codebase-cleanup/dist/cli/index.js analyze \
  --path app/features/feature-x \
  --output reports/feature-x-analysis \
  --format both

# Revisar e corrigir issues
# Commit correções
git add .
git commit -m "fix: resolve code quality issues in feature-x"
```

### 3. Documentação de Issues

```bash
# Gerar relatório detalhado
node codebase-cleanup/dist/cli/index.js analyze \
  --path .. \
  --output reports/detailed-analysis \
  --format markdown

# Adicionar ao README
cat reports/detailed-analysis.md >> docs/CODE_QUALITY.md
```

---

## 🆘 Troubleshooting

### Problema: "Out of Memory"

```bash
# Solução 1: Aumentar memória
node --max-old-space-size=8192 dist/cli/index.js analyze ...

# Solução 2: Analisar em partes menores
for dir in app/* ; do
  node dist/cli/index.js analyze --path "$dir" --output "reports/$(basename $dir)"
done
```

### Problema: Análise muito lenta

```bash
# Solução: Excluir mais diretórios
node dist/cli/index.js analyze \
  --path .. \
  --exclude "**/node_modules/**,**/.next/**,**/dist/**,**/build/**,**/.git/**,**/coverage/**,**/public/**"
```

### Problema: Muitos falsos positivos

```bash
# Solução: Configurar .analyzerignore
cat > .analyzerignore << EOF
# Ignorar arquivos gerados
*.generated.ts
*.d.ts

# Ignorar testes
**/*.test.ts
**/*.spec.ts

# Ignorar mocks
**/__mocks__/**
EOF
```

---

## 📚 Recursos Adicionais

- **Documentação Completa**: `codebase-cleanup/README.md`
- **Tipos e Interfaces**: `codebase-cleanup/src/types.ts`
- **Exemplos**: `codebase-cleanup/examples/`
- **Testes**: `codebase-cleanup/tests/`

---

**Última Atualização**: 18 de Janeiro de 2026  
**Versão do Analyzer**: 1.0.0
