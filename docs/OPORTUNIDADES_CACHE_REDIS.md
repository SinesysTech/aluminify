# Oportunidades de Cache com Redis (Upstash)

**Data:** 6 de dezembro de 2025

## 📋 Resumo Executivo

Após análise completa do código, identifiquei **8 áreas principais** que podem se beneficiar significativamente do uso de cache via Redis (Upstash). O Redis já está configurado no projeto, mas não está sendo utilizado atualmente.

---

## 🎯 Oportunidades Identificadas (Priorizadas)

### 1. ⭐⭐⭐ **Estrutura Hierárquica de Cursos** (ALTA PRIORIDADE)

**O que cachear:**
- Cursos → Disciplinas → Frentes → Módulos → Aulas
- Relacionamentos `cursos_disciplinas`

**Por que cachear:**
- ✅ Dados mudam **raramente** (apenas quando admin adiciona/remove conteúdo)
- ✅ Consultados **frequentemente** em múltiplas páginas:
  - Sala de Estudos
  - Cronograma (Wizard e Dashboard)
  - Conteúdos
  - Modo Foco
  - Flashcards
- ✅ Queries complexas com múltiplos JOINs
- ✅ Mesmos dados para todos os usuários (ou por curso)

**Impacto:**
- **Redução de queries:** De ~5-10 queries por página para 0 (cache hit)
- **Performance:** Redução de 200-500ms para <10ms
- **Custo:** Redução significativa de chamadas ao Supabase

**TTL Sugerido:** 1 hora (invalidação manual quando houver mudanças)

**Arquivos afetados:**
- `app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx`
- `components/schedule-wizard.tsx`
- `app/(dashboard)/conteudos/conteudos-client.tsx`
- `app/(dashboard)/aluno/modo-foco/modo-foco-client.tsx`
- `backend/services/cronograma/cronograma.service.ts`

---

### 2. ⭐⭐⭐ **Materiais de Curso** (ALTA PRIORIDADE)

**O que cachear:**
- Lista de materiais por curso (`course_materials`)
- Metadados dos materiais (nome, ordem, tipo)

**Por que cachear:**
- ✅ Dados mudam raramente
- ✅ Consultados em biblioteca do aluno
- ✅ Mesmos dados para todos os alunos do mesmo curso

**Impacto:**
- **Redução de queries:** 1 query por requisição → 0 (cache hit)
- **Performance:** Redução de 100-200ms para <5ms

**TTL Sugerido:** 30 minutos

**Arquivos afetados:**
- `app/(dashboard)/aluno/biblioteca/page.tsx`
- `backend/services/course-material/course-material.service.ts`
- `app/api/course-material/route.ts`

---

### 3. ⭐⭐ **Flashcards - Listagens e Filtros** (MÉDIA PRIORIDADE)

**O que cachear:**
- Lista de flashcards por disciplina/frente/módulo
- Contadores de flashcards por módulo
- Metadados de flashcards (sem dados de revisão do aluno)

**Por que cachear:**
- ✅ Dados de flashcards mudam raramente (apenas quando professor adiciona)
- ✅ Consultados frequentemente em listagens
- ⚠️ **NÃO cachear:** Dados de revisão individual do aluno (mudam frequentemente)

**Impacto:**
- **Redução de queries:** 2-3 queries por listagem → 0 (cache hit)
- **Performance:** Redução de 150-300ms para <10ms

**TTL Sugerido:** 15 minutos (invalidação quando flashcard é criado/editado)

**Arquivos afetados:**
- `app/api/flashcards/route.ts`
- `backend/services/flashcards/flashcards.service.ts`
- `app/(dashboard)/aluno/flashcards/flashcards-client.tsx`

---

### 4. ⭐⭐ **Cronograma - Estrutura e Itens** (MÉDIA PRIORIDADE)

**O que cachear:**
- Estrutura do cronograma (sem dados de conclusão)
- Hierarquia de aulas do cronograma
- ⚠️ **NÃO cachear:** Status de conclusão (muda quando aluno marca como concluído)

**Por que cachear:**
- ✅ Estrutura muda raramente (apenas quando cronograma é gerado/atualizado)
- ✅ Consultados em múltiplas visualizações (Dashboard, Calendário)
- ✅ Queries complexas com múltiplos JOINs

**Impacto:**
- **Redução de queries:** 3-5 queries por carregamento → 1-2 (apenas progresso)
- **Performance:** Redução de 300-600ms para 50-100ms

**TTL Sugerido:** 30 minutos (invalidação quando cronograma é atualizado)

**Arquivos afetados:**
- `components/schedule-calendar-view.tsx`
- `components/schedule-dashboard.tsx`
- `backend/services/cronograma/cronograma.service.ts`

---

### 5. ⭐ **Sessões de Estudo - Estado Temporário** (BAIXA PRIORIDADE)

**O que cachear:**
- Estado da sessão de estudo em andamento (heartbeat)
- Timestamps de última atualização

**Por que cachear:**
- ✅ Reduz chamadas ao banco durante sessão ativa
- ✅ Heartbeat frequente (a cada 30s-60s)
- ✅ Dados temporários (não precisam persistir muito tempo)

**Impacto:**
- **Redução de queries:** 1 query a cada 30s → 1 query a cada 5min
- **Performance:** Redução de latência no heartbeat

**TTL Sugerido:** 10 minutos (sessão ativa)

**Arquivos afetados:**
- `app/api/sessao/heartbeat/route.ts`
- `backend/services/sessao-estudo/sessao-estudo.service.ts`

---

### 6. ⭐ **Perfil de Usuário - Dados Estáticos** (BAIXA PRIORIDADE)

**O que cachear:**
- Nome completo do professor
- Role do usuário
- Metadados que mudam raramente

**Por que cachear:**
- ✅ Consultado em múltiplas requisições (NavUser, middleware)
- ✅ Dados mudam raramente
- ⚠️ **NÃO cachear:** Dados sensíveis ou que mudam frequentemente

**Impacto:**
- **Redução de queries:** 1-2 queries por requisição autenticada → 0 (cache hit)
- **Performance:** Redução de 50-100ms para <5ms

**TTL Sugerido:** 5 minutos

**Arquivos afetados:**
- `components/nav-user.tsx`
- `backend/auth/middleware.ts`
- `lib/auth.ts`

---

### 7. ⭐ **Atividades - Estrutura (sem Progresso)** (BAIXA PRIORIDADE)

**O que cachear:**
- Lista de atividades por módulo (estrutura)
- Metadados de atividades (título, tipo, ordem)
- ⚠️ **NÃO cachear:** Progresso do aluno (muda quando marca como concluído)

**Por que cachear:**
- ✅ Estrutura muda raramente
- ✅ Consultada em Sala de Estudos
- ✅ Queries complexas com JOINs

**Impacto:**
- **Redução de queries:** 2-3 queries por carregamento → 1 (apenas progresso)
- **Performance:** Redução de 200-400ms para 50-100ms

**TTL Sugerido:** 30 minutos

**Arquivos afetados:**
- `app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx`
- `backend/services/atividade/atividade.repository-helper.ts`

---

### 8. ⭐ **Conversas do Chat - Metadados** (BAIXA PRIORIDADE)

**O que cachear:**
- Lista de conversas (IDs, títulos, timestamps)
- ⚠️ **NÃO cachear:** Histórico de mensagens (muda a cada mensagem)

**Por que cachear:**
- ✅ Lista de conversas consultada frequentemente
- ✅ Metadados mudam raramente (apenas quando nova conversa é criada)

**Impacto:**
- **Redução de queries:** 1 query por carregamento de painel → 0 (cache hit)
- **Performance:** Redução de 100-200ms para <5ms

**TTL Sugerido:** 5 minutos

**Arquivos afetados:**
- `components/conversations-panel.tsx`
- `app/api/conversations/route.ts`

---

## 🏗️ Arquitetura de Cache Sugerida

### Estrutura de Chaves Redis

```
# Estrutura Hierárquica
cache:curso:{cursoId}:estrutura          # TTL: 1h
cache:disciplina:{disciplinaId}:frentes  # TTL: 1h
cache:frente:{frenteId}:modulos           # TTL: 1h
cache:modulo:{moduloId}:aulas             # TTL: 1h

# Materiais
cache:curso:{cursoId}:materiais           # TTL: 30min

# Flashcards
cache:flashcards:disciplina:{disciplinaId}      # TTL: 15min
cache:flashcards:frente:{frenteId}              # TTL: 15min
cache:flashcards:modulo:{moduloId}              # TTL: 15min

# Cronograma
cache:cronograma:{cronogramaId}:estrutura      # TTL: 30min
cache:cronograma:{cronogramaId}:itens           # TTL: 30min

# Sessão de Estudo
cache:sessao:{sessaoId}:estado                  # TTL: 10min

# Usuário
cache:user:{userId}:perfil                       # TTL: 5min

# Atividades
cache:modulo:{moduloId}:atividades               # TTL: 30min

# Conversas
cache:user:{userId}:conversas                    # TTL: 5min
```

### Padrão de Invalidação

```typescript
// Quando curso/disciplina/frente/módulo é criado/editado
await redis.del(`cache:curso:${cursoId}:estrutura`);
await redis.del(`cache:disciplina:${disciplinaId}:frentes`);
// ... etc

// Quando flashcard é criado/editado
await redis.del(`cache:flashcards:modulo:${moduloId}`);
await redis.del(`cache:flashcards:frente:${frenteId}`);
await redis.del(`cache:flashcards:disciplina:${disciplinaId}`);

// Quando cronograma é atualizado
await redis.del(`cache:cronograma:${cronogramaId}:*`); // Pattern delete
```

---

## 📊 Estimativa de Impacto

### Redução de Queries ao Banco

| Área | Queries Antes | Queries Depois | Redução |
|------|---------------|----------------|---------|
| Estrutura Hierárquica | 5-10 | 0-1 | **80-100%** |
| Materiais | 1 | 0 | **100%** |
| Flashcards | 2-3 | 0-1 | **50-100%** |
| Cronograma | 3-5 | 1-2 | **40-60%** |
| Sessão de Estudo | 120/hora | 12/hora | **90%** |
| Perfil Usuário | 1-2/req | 0 | **100%** |
| Atividades | 2-3 | 1 | **50-66%** |
| Conversas | 1 | 0 | **100%** |

### Melhoria de Performance

| Área | Tempo Antes | Tempo Depois | Melhoria |
|------|-------------|--------------|----------|
| Estrutura Hierárquica | 200-500ms | <10ms | **95-98%** |
| Materiais | 100-200ms | <5ms | **95-97%** |
| Flashcards | 150-300ms | <10ms | **93-97%** |
| Cronograma | 300-600ms | 50-100ms | **67-83%** |
| Sessão de Estudo | 50-100ms | 10-20ms | **60-80%** |
| Perfil Usuário | 50-100ms | <5ms | **90-95%** |
| Atividades | 200-400ms | 50-100ms | **50-75%** |
| Conversas | 100-200ms | <5ms | **95-97%** |

---

## 🚀 Plano de Implementação Recomendado

### Fase 1: Quick Wins (1-2 dias)
1. ✅ **Estrutura Hierárquica** - Maior impacto, fácil implementar
2. ✅ **Materiais de Curso** - Simples, alto impacto

### Fase 2: Médio Prazo (3-5 dias)
3. ✅ **Flashcards** - Médio impacto, requer invalidação
4. ✅ **Cronograma** - Médio impacto, estrutura complexa

### Fase 3: Otimizações (1 semana)
5. ✅ **Sessão de Estudo** - Baixo impacto, mas útil
6. ✅ **Perfil Usuário** - Baixo impacto, fácil implementar
7. ✅ **Atividades** - Baixo impacto, estrutura complexa
8. ✅ **Conversas** - Baixo impacto, fácil implementar

---

## 💻 Exemplo de Implementação

### Serviço de Cache Genérico

```typescript
// backend/services/cache/cache.service.ts
import { Redis } from '@upstash/redis';

class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;

  constructor() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      this.redis = new Redis({ url: redisUrl, token: redisToken });
      this.enabled = true;
      console.log('[Cache] ✅ Redis configurado');
    } else {
      console.warn('[Cache] ⚠️ Redis não configurado - cache desabilitado');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null;
    
    try {
      const data = await this.redis.get<T>(key);
      return data;
    } catch (error) {
      console.error('[Cache] Erro ao ler:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.enabled || !this.redis) return;
    
    try {
      await this.redis.setex(key, ttlSeconds, value);
    } catch (error) {
      console.error('[Cache] Erro ao escrever:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.redis) return;
    
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('[Cache] Erro ao deletar:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.redis) return;
    
    // Upstash Redis não suporta KEYS diretamente
    // Implementar invalidação manual por prefixo conhecido
    console.warn('[Cache] Pattern delete não suportado - use invalidação manual');
  }
}

export const cacheService = new CacheService();
```

### Exemplo de Uso - Estrutura Hierárquica

```typescript
// backend/services/course/course-structure.service.ts
import { cacheService } from '@/backend/services/cache/cache.service';

async function getCourseStructure(courseId: string) {
  const cacheKey = `cache:curso:${courseId}:estrutura`;
  
  // Tentar cache primeiro
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    console.log('[Cache] ✅ Hit:', cacheKey);
    return cached;
  }

  // Cache miss - buscar do banco
  console.log('[Cache] ❌ Miss:', cacheKey);
  const structure = await fetchFromDatabase(courseId);
  
  // Armazenar no cache (TTL: 1 hora)
  await cacheService.set(cacheKey, structure, 3600);
  
  return structure;
}

// Invalidação quando estrutura muda
async function invalidateCourseStructure(courseId: string) {
  await cacheService.del(`cache:curso:${courseId}:estrutura`);
  // Invalidar também estruturas relacionadas
  await cacheService.del(`cache:disciplina:*:frentes`); // Pattern delete manual
}
```

---

## ⚠️ Considerações Importantes

### O que NÃO cachear:
1. ❌ **Dados de progresso do aluno** (mudam frequentemente)
2. ❌ **Dados sensíveis** (senhas, tokens)
3. ❌ **Dados que mudam a cada requisição**
4. ❌ **Dados específicos do usuário que mudam frequentemente**

### Boas Práticas:
1. ✅ **Sempre validar cache** - Se Redis falhar, buscar do banco
2. ✅ **TTL apropriado** - Balancear frescor vs performance
3. ✅ **Invalidação explícita** - Limpar cache quando dados mudam
4. ✅ **Fallback gracioso** - Sistema deve funcionar sem cache
5. ✅ **Monitoramento** - Logs de hit/miss rate

### Limitações do Upstash Redis:
- ❌ Não suporta `KEYS` pattern matching (limitação de segurança)
- ✅ Usar invalidação manual por prefixo conhecido
- ✅ TTL automático funciona perfeitamente
- ✅ Suporta JSON nativamente

---

## 📈 Métricas para Monitorar

1. **Cache Hit Rate** - % de requisições que usam cache
2. **Redução de Queries** - Número de queries evitadas
3. **Melhoria de Latência** - Tempo médio de resposta
4. **Uso de Memória Redis** - Monitorar limites do plano
5. **Custo Supabase** - Redução de chamadas ao banco

---

## 🎯 Conclusão

O Redis (Upstash) pode trazer **benefícios significativos** para o app, especialmente nas áreas de:

1. **Estrutura Hierárquica** - Maior impacto (80-100% redução de queries)
2. **Materiais de Curso** - Alto impacto, fácil implementar
3. **Flashcards** - Médio impacto, melhora UX

**Recomendação:** Começar pela **Fase 1** (Estrutura Hierárquica + Materiais) que já trará **80% dos benefícios** com **20% do esforço**.

