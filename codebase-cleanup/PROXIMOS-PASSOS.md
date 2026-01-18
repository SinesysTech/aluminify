# Próximos Passos - Correção de Erros no codebase-cleanup

## Resumo Executivo

Foram corrigidos **22 testes** (~16% dos falhando) com foco em:
- ✅ Estrutura de testes
- ✅ Categorização de arquivos (Windows/Linux)
- ✅ Detecção de error handling

Restam **~112 testes falhando** que precisam de atenção.

## Plano de Ação por Módulo

### 📋 Módulo 1: Service Pattern Analyzer (Prioridade Alta)

**Arquivos:**
- `src/analyzers/service-pattern-analyzer.ts`
- `tests/unit/analyzers/service-pattern-analyzer.test.ts`

**Problemas:**
1. Circular dependency detection não está funcionando
2. Service dependency tracking retorna array vazio
3. Excessive dependencies não é detectado

**Ações Recomendadas:**
```typescript
// Verificar se o método getServiceDependencies() está populando corretamente
// Revisar algoritmo de detecção de ciclos (DFS/BFS)
// Adicionar logs de debug para rastrear o fluxo
```

**Testes Afetados:** 3
**Tempo Estimado:** 2-3 horas

---

### 📋 Módulo 2: Database Pattern Analyzer (Prioridade Alta)

**Arquivos:**
- `src/analyzers/database-pattern-analyzer.ts`
- `tests/unit/analyzers/database-pattern-analyzer.test.ts`

**Problemas:**
1. ✅ Error handling detection (CORRIGIDO)
2. ⚠️ Inconsistent type usage não detectado
3. ⚠️ SQL injection detection não funciona
4. ⚠️ Type safety issues não detectados

**Ações Recomendadas:**
```typescript
// 1. Revisar detectTypeInconsistencies()
// 2. Melhorar detectPatternBypass() para SQL injection
// 3. Adicionar detecção de 'any' type em destructuring
// 4. Verificar regex patterns para template literals
```

**Testes Afetados:** 10
**Tempo Estimado:** 3-4 horas

---

### 📋 Módulo 3: Property-Based Tests (Prioridade Média)

**Arquivos:**
- `tests/property/file-discovery.property.test.ts`
- `tests/property/database-pattern-detection.property.test.ts`

**Problemas:**
1. Timeouts frequentes (10s)
2. Geração de estruturas de arquivos muito complexas
3. Falhas em casos edge

**Ações Recomendadas:**
```typescript
// 1. Aumentar timeout para 30s ou 60s
// 2. Limitar complexidade dos dados gerados
// 3. Adicionar skip para testes muito lentos
// 4. Considerar usar fixtures ao invés de geração aleatória
```

**Configuração Sugerida:**
```typescript
it('test name', async () => {
  // ...
}, 30000); // 30 segundos
```

**Testes Afetados:** 8
**Tempo Estimado:** 2 horas

---

### 📋 Módulo 4: API Route Pattern Analyzer (Prioridade Média)

**Arquivos:**
- `src/analyzers/api-route-pattern-analyzer.ts`
- `tests/unit/analyzers/api-route-pattern-analyzer.test.ts`

**Problemas:**
1. Inconsistent request validation não detectado

**Ações Recomendadas:**
```typescript
// Revisar lógica de detecção de múltiplas abordagens de validação
// Verificar se está identificando corretamente:
// - Zod schemas
// - Manual validation
// - Joi schemas
```

**Testes Afetados:** 1
**Tempo Estimado:** 1 hora

---

### 📋 Módulo 5: Component Pattern Analyzer (Prioridade Baixa)

**Arquivos:**
- `src/analyzers/component-pattern-analyzer.ts`
- `tests/unit/analyzers/component-pattern-analyzer.test.ts`

**Problemas:**
1. ✅ Estrutura de testes (CORRIGIDO)
2. ✅ Prop drilling detection (CORRIGIDO)
3. ⚠️ Arrow function prop drilling não detectado

**Ações Recomendadas:**
```typescript
// Melhorar detecção de prop drilling em arrow functions
// Verificar se está analisando corretamente:
// const Component = ({ prop }) => <Child prop={prop} />
```

**Testes Afetados:** 1
**Tempo Estimado:** 1 hora

---

### 📋 Módulo 6: Code Quality Analyzer (Prioridade Baixa)

**Arquivos:**
- `src/analyzers/code-quality-analyzer.ts`
- `tests/unit/analyzers/code-quality-analyzer.test.ts`

**Problemas:**
1. Timeout em deeply nested conditionals

**Ações Recomendadas:**
```typescript
// Otimizar algoritmo de contagem de aninhamento
// Adicionar early return quando profundidade > threshold
// Considerar usar cache para nós já visitados
```

**Testes Afetados:** 1
**Tempo Estimado:** 1 hora

---

## Estratégia de Correção Recomendada

### Fase 1: Correções Críticas (1 dia)
1. ✅ File scanner categorization (CONCLUÍDO)
2. ✅ Database error handling (CONCLUÍDO)
3. 🔄 Service circular dependencies
4. 🔄 Database type safety

### Fase 2: Correções Importantes (1 dia)
5. 🔄 Database SQL injection detection
6. 🔄 Property-based test timeouts
7. 🔄 API route validation detection

### Fase 3: Refinamentos (meio dia)
8. 🔄 Component arrow function prop drilling
9. 🔄 Code quality optimization
10. 🔄 Testes edge cases

## Ferramentas de Debug

### 1. Executar Teste Específico
```bash
npm test -- tests/unit/analyzers/service-pattern-analyzer.test.ts
```

### 2. Executar com Verbose
```bash
npm test -- --reporter=verbose
```

### 3. Executar Apenas um Teste
```bash
npm test -- -t "should detect circular dependency"
```

### 4. Debug com Node Inspector
```bash
node --inspect-brk node_modules/.bin/vitest run
```

### 5. Adicionar Logs Temporários
```typescript
console.log('DEBUG:', { variable, state });
```

## Checklist de Correção

Para cada módulo:
- [ ] Ler o teste falhando
- [ ] Entender o comportamento esperado
- [ ] Adicionar logs de debug na implementação
- [ ] Executar teste isolado
- [ ] Corrigir a lógica
- [ ] Remover logs de debug
- [ ] Executar todos os testes do módulo
- [ ] Compilar TypeScript
- [ ] Verificar diagnósticos
- [ ] Documentar a correção

## Métricas de Sucesso

### Objetivo Mínimo (1 dia)
- [ ] 50% dos testes passando (~374 testes)
- [ ] 0 erros de compilação
- [ ] 0 erros de diagnóstico

### Objetivo Ideal (2 dias)
- [ ] 80% dos testes passando (~598 testes)
- [ ] Todos os testes unitários passando
- [ ] Property-based tests estáveis

### Objetivo Completo (3 dias)
- [ ] 100% dos testes passando (748 testes)
- [ ] Documentação atualizada
- [ ] CI/CD configurado

## Recursos Úteis

### Documentação
- [ts-morph](https://ts-morph.com/) - AST manipulation
- [vitest](https://vitest.dev/) - Test framework
- [fast-check](https://fast-check.dev/) - Property-based testing

### Padrões de Código
- Sempre usar `Node.is*()` para type guards
- Preferir `getText()` para análise de texto
- Usar `getParent()` com cuidado (pode ser undefined)
- Adicionar early returns para performance

### Boas Práticas
1. Testar localmente antes de commit
2. Manter testes isolados e independentes
3. Usar fixtures para dados complexos
4. Documentar decisões de design
5. Adicionar comentários em lógica complexa

## Contato e Suporte

Para dúvidas ou problemas:
1. Verificar documentação em `docs/`
2. Revisar testes existentes como exemplos
3. Consultar issues no repositório
4. Adicionar logs de debug para investigação

---

**Última Atualização:** 2026-01-18  
**Status:** 22 testes corrigidos, 112 restantes  
**Próxima Revisão:** Após correção do Módulo 1 (Service Pattern Analyzer)
