# 🔍 Análise Técnica: Algoritmo de Revisão Inteligente para Flashcards

**Data:** 2025-01-31  
**Autor:** Arquiteto de Software Sênior  
**Objetivo:** Validar estrutura atual e recomendar implementação do algoritmo de Repetição Espaçada (SRS)

---

## 📊 1. Estrutura de Persistência (SRS)

### 1.1. Análise da Tabela `progresso_flashcards`

**Estrutura Atual:**
```sql
CREATE TABLE public.progresso_flashcards (
    id UUID PRIMARY KEY,
    aluno_id UUID REFERENCES alunos(id),
    flashcard_id UUID REFERENCES flashcards(id),
    nivel_facilidade DOUBLE PRECISION DEFAULT 2.5,  -- ✅ Equivale a ease_factor
    dias_intervalo INTEGER DEFAULT 0,              -- ✅ Equivale a interval
    data_proxima_revisao TIMESTAMP WITH TIME ZONE, -- ✅ Data calculada
    numero_revisoes INTEGER DEFAULT 0,              -- ✅ Equivale a repetitions/streak
    ultimo_feedback INTEGER,                        -- ✅ Histórico de feedback
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### 1.2. Mapeamento SM-2 vs Estrutura Atual

| Campo SM-2 | Campo Atual | Status | Observação |
|------------|-------------|--------|------------|
| `ease_factor` | `nivel_facilidade` | ✅ **OK** | Já existe (default 2.5) |
| `interval` | `dias_intervalo` | ✅ **OK** | Já existe (em dias) |
| `repetitions` | `numero_revisoes` | ⚠️ **PARCIAL** | Conta total, não sequência |
| `streak` | ❌ | ❌ **FALTANDO** | Não existe campo de sequência |

### 1.3. Recomendações de Melhoria

#### ✅ **Campos Existentes (Suficientes para SM-2 Básico)**
A estrutura atual **JÁ SUPORTA** um algoritmo SM-2 funcional:
- `nivel_facilidade` (ease_factor): ✅ Presente
- `dias_intervalo` (interval): ✅ Presente  
- `data_proxima_revisao`: ✅ Presente
- `numero_revisoes`: ✅ Presente (pode ser usado como contador)

#### ⚠️ **Campo Opcional Recomendado: `sequencia_acertos`**

Para um algoritmo SM-2 mais robusto, recomendo adicionar:

```sql
ALTER TABLE public.progresso_flashcards
ADD COLUMN sequencia_acertos INTEGER DEFAULT 0;

COMMENT ON COLUMN progresso_flashcards.sequencia_acertos IS 
'Sequência de acertos consecutivos (streak). Resetado quando feedback = 1 (Errei)';
```

**Por quê?**
- O campo `numero_revisoes` conta o total de revisões, não a sequência atual
- SM-2 usa `repetitions` para determinar se é primeira, segunda, terceira revisão
- Facilita implementação de lógica: "se sequencia_acertos = 0, intervalo = 1 dia"

**Alternativa (sem migration):**
- Podemos usar `ultimo_feedback = 1` como indicador de reset
- Se `ultimo_feedback = 1`, tratar como `sequencia_acertos = 0`
- Se `ultimo_feedback IN (2,3,4)`, incrementar contador interno

### 1.4. Conclusão - Estrutura de Persistência

**✅ ESTRUTURA ATUAL É SUFICIENTE** para implementar SM-2.

**Recomendação:**
- **Opção A (Rápida):** Usar estrutura atual, tratando `ultimo_feedback = 1` como reset
- **Opção B (Ideal):** Adicionar `sequencia_acertos` para maior precisão

---

## 🎯 2. Estratégia de Query para "UTI dos Erros"

### 2.1. Requisito

Distribuição ponderada para modo "UTI":
- **50%** de cards com `ultimo_feedback = 1` (Errei)
- **30%** de cards com `ultimo_feedback = 2` (Parcial)
- **20%** de cards com `ultimo_feedback = 3` (Difícil)

### 2.2. Análise de Performance

#### ❌ **Abordagem 1: UNION ALL (Não Recomendada)**

```sql
-- 3 queries separadas + UNION
(
  SELECT * FROM progresso_flashcards 
  WHERE ultimo_feedback = 1 LIMIT 10
)
UNION ALL
(
  SELECT * FROM progresso_flashcards 
  WHERE ultimo_feedback = 2 LIMIT 6
)
UNION ALL
(
  SELECT * FROM progresso_flashcards 
  WHERE ultimo_feedback = 3 LIMIT 4
)
```

**Problemas:**
- 3 scans completos na tabela
- Não garante distribuição exata se houver poucos cards
- Difícil de randomizar dentro de cada grupo

#### ✅ **Abordagem 2: CTE com Window Functions (Recomendada)**

```sql
WITH cards_por_feedback AS (
  SELECT 
    pf.*,
    f.*,
    ROW_NUMBER() OVER (
      PARTITION BY pf.ultimo_feedback 
      ORDER BY RANDOM()
    ) as rn,
    CASE 
      WHEN pf.ultimo_feedback = 1 THEN 0.5  -- 50%
      WHEN pf.ultimo_feedback = 2 THEN 0.3   -- 30%
      WHEN pf.ultimo_feedback = 3 THEN 0.2   -- 20%
      ELSE 0
    END as peso
  FROM progresso_flashcards pf
  INNER JOIN flashcards f ON f.id = pf.flashcard_id
  WHERE pf.aluno_id = $1
    AND pf.ultimo_feedback IN (1, 2, 3)
    AND (pf.data_proxima_revisao IS NULL OR pf.data_proxima_revisao <= NOW())
),
distribuicao AS (
  SELECT *,
    CASE 
      WHEN ultimo_feedback = 1 AND rn <= CEIL(20 * 0.5) THEN true
      WHEN ultimo_feedback = 2 AND rn <= CEIL(20 * 0.3) THEN true
      WHEN ultimo_feedback = 3 AND rn <= CEIL(20 * 0.2) THEN true
      ELSE false
    END as selecionado
  FROM cards_por_feedback
)
SELECT * FROM distribuicao WHERE selecionado = true
ORDER BY RANDOM()
LIMIT 20;
```

**Vantagens:**
- 1 scan único na tabela
- Randomização dentro de cada grupo
- Distribuição proporcional garantida
- Performance superior

#### ✅ **Abordagem 3: Query Simples com Ordenação Ponderada (Mais Simples)**

```sql
SELECT 
  pf.*,
  f.*,
  CASE 
    WHEN pf.ultimo_feedback = 1 THEN 1  -- Prioridade máxima
    WHEN pf.ultimo_feedback = 2 THEN 2
    WHEN pf.ultimo_feedback = 3 THEN 3
    ELSE 99
  END as prioridade
FROM progresso_flashcards pf
INNER JOIN flashcards f ON f.id = pf.flashcard_id
WHERE pf.aluno_id = $1
  AND pf.ultimo_feedback IN (1, 2, 3)
  AND (pf.data_proxima_revisao IS NULL OR pf.data_proxima_revisao <= NOW())
ORDER BY 
  prioridade ASC,  -- Erros primeiro
  RANDOM()         -- Randomiza dentro do grupo
LIMIT 20;
```

**Vantagens:**
- Query extremamente simples
- Performance excelente (1 scan + sort)
- Garante que erros apareçam primeiro
- Implementação rápida

**Desvantagem:**
- Não garante distribuição exata 50/30/20 (mas garante prioridade)

### 2.3. Recomendação Final

**✅ Usar Abordagem 3 (Query Simples)** para MVP, com possibilidade de evoluir para Abordagem 2 se necessário.

**Justificativa:**
1. **Simplicidade:** Código mais fácil de manter
2. **Performance:** 1 scan único, índice em `aluno_id` + `ultimo_feedback`
3. **Suficiente:** Prioriza erros, que é o objetivo principal
4. **Evolutiva:** Pode ser refinada depois com CTE se necessário

**Índices Recomendados:**
```sql
CREATE INDEX IF NOT EXISTS idx_progresso_flashcards_uti 
ON progresso_flashcards(aluno_id, ultimo_feedback, data_proxima_revisao)
WHERE ultimo_feedback IN (1, 2, 3);
```

---

## ⚙️ 3. Lógica de Agendamento

### 3.1. Onde Implementar?

#### ❌ **Opção A: Backend (API Route)**

**Localização:** `app/api/flashcards/feedback/route.ts` → `flashcardsService.sendFeedback()`

**Código Atual:**
```typescript
// backend/services/flashcards/flashcards.service.ts (linhas 641-659)
const now = new Date();
const prevInterval = existing?.dias_intervalo ?? 0;
let diasIntervalo = 1;
let nivelFacilidade = existing?.nivel_facilidade ?? 2.5;

if (feedback === 1) {
  diasIntervalo = 1;
  nivelFacilidade = Math.max(1.3, nivelFacilidade - 0.2);
} else {
  const intervaloBase = Math.max(1, prevInterval || 1);
  const fator = nivelFacilidade || 2.5;
  diasIntervalo = Math.max(1, Math.round(intervaloBase * fator));
  if (feedback === 2) {
    nivelFacilidade = Math.max(1.3, nivelFacilidade - 0.15);
  } else if (feedback === 3) {
    nivelFacilidade = Math.min(3.5, nivelFacilidade + 0.05);
  } else if (feedback === 4) {
    nivelFacilidade = Math.min(3.5, nivelFacilidade + 0.15);
  }
}

const proximaRevisao = new Date(now);
proximaRevisao.setDate(proximaRevisao.getDate() + diasIntervalo);
```

**Vantagens:**
- ✅ Fácil de debugar (logs, breakpoints)
- ✅ Testável (unit tests)
- ✅ Versionável (Git)
- ✅ Flexível (pode mudar algoritmo sem migration)

**Desvantagens:**
- ⚠️ Lógica espalhada no código
- ⚠️ Requer deploy para mudar pesos

#### ❌ **Opção B: Banco de Dados (Postgres Function/Trigger)**

**Exemplo:**
```sql
CREATE OR REPLACE FUNCTION calcular_proxima_revisao(
  p_feedback INTEGER,
  p_nivel_facilidade DOUBLE PRECISION,
  p_dias_intervalo INTEGER
) RETURNS TABLE (
  novo_nivel_facilidade DOUBLE PRECISION,
  novos_dias_intervalo INTEGER,
  data_proxima_revisao TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_nivel_facilidade DOUBLE PRECISION;
  v_dias_intervalo INTEGER;
BEGIN
  -- Lógica SM-2 aqui
  -- ...
  RETURN QUERY SELECT v_nivel_facilidade, v_dias_intervalo, NOW() + (v_dias_intervalo || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;
```

**Vantagens:**
- ✅ Centralizada no banco
- ✅ Consistência garantida
- ✅ Performance (execução no servidor)

**Desvantagens:**
- ❌ Difícil de debugar
- ❌ Difícil de testar
- ❌ Requer migration para mudar
- ❌ Menos flexível para A/B testing

### 3.2. Recomendação Final

**✅ IMPLEMENTAR NO BACKEND (Opção A)** - Manter como está, mas refatorar.

**Justificativa:**
1. **Manutenibilidade:** Código TypeScript é mais fácil de manter que PL/pgSQL
2. **Testabilidade:** Pode criar unit tests para o algoritmo
3. **Flexibilidade:** Pode fazer A/B testing de diferentes algoritmos
4. **Versionamento:** Mudanças ficam no histórico do Git
5. **Debugging:** Logs e breakpoints funcionam normalmente

### 3.3. Sugestão de Refatoração

**Criar módulo dedicado para algoritmo SRS:**

```
backend/services/flashcards/
  ├── flashcards.service.ts
  ├── srs-algorithm.ts          # ← Novo arquivo
  └── srs-algorithm.types.ts     # ← Novo arquivo
```

**Estrutura Proposta:**
```typescript
// backend/services/flashcards/srs-algorithm.ts

export interface SRSConfig {
  easeFactorMin: number;      // 1.3
  easeFactorMax: number;       // 3.5
  easeFactorInitial: number;  // 2.5
  feedbackWeights: {
    [key: number]: {
      easeFactorDelta: number;
      intervalMultiplier?: number;
    };
  };
}

export interface SRSState {
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastFeedback: number | null;
}

export interface SRSResult {
  newEaseFactor: number;
  newInterval: number;
  nextReviewDate: Date;
  newRepetitions: number;
}

export function calculateNextReview(
  feedback: 1 | 2 | 3 | 4,
  currentState: SRSState,
  config?: Partial<SRSConfig>
): SRSResult {
  // Lógica SM-2 aqui
  // ...
}
```

**Benefícios:**
- ✅ Algoritmo isolado e testável
- ✅ Configuração centralizada
- ✅ Fácil de trocar algoritmo (SM-2 → FSRS → Anki)
- ✅ Pode ler configuração de arquivo/env se necessário

---

## 📦 4. Contexto de Sessão

### 4.1. Análise do Endpoint Atual

**Endpoint:** `GET /api/flashcards/revisao?modo=...`

**Código Atual:**
```typescript
// backend/services/flashcards/flashcards.service.ts (linha 601)
const shuffled = this.shuffle(dueCards);
return shuffled.slice(0, 20).map((c) => {
  const progress = progressMap.get(c.id);
  return {
    ...c,
    dataProximaRevisao: progress?.data_proxima_revisao ?? null,
  };
});
```

### 4.2. Comportamento Atual

**✅ Retorna array fixo de 20 cards** (não é stream)

**Fluxo:**
1. Busca todos os cards "due" (data_proxima_revisao <= now)
2. Embaralha aleatoriamente
3. Retorna primeiros 20
4. Frontend itera sobre o array

### 4.3. Problema Identificado

**⚠️ RISCO: Cards podem repetir em sessões longas**

**Cenário:**
- Aluno inicia sessão com 20 cards
- Estuda 10 cards e dá feedback
- Recarrega a página (ou faz nova requisição)
- Sistema busca novos cards "due"
- **Pode retornar cards já vistos na mesma sessão**

### 4.4. Soluções Recomendadas

#### ✅ **Solução 1: Rastrear IDs na Sessão (Frontend)**

**Implementação:**
```typescript
// Frontend mantém Set de IDs já vistos
const [cardsVistos, setCardsVistos] = useState<Set<string>>(new Set());

// Ao receber novos cards, filtrar os já vistos
const novosCards = cards.filter(c => !cardsVistos.has(c.id));

// Ao dar feedback, adicionar ao Set
setCardsVistos(prev => new Set([...prev, cardId]));
```

**Vantagens:**
- ✅ Simples de implementar
- ✅ Não requer mudança no backend
- ✅ Funciona para sessões longas

**Desvantagens:**
- ⚠️ Perde estado se recarregar página
- ⚠️ Não funciona entre dispositivos

#### ✅ **Solução 2: Sessão no Backend (Recomendada para Produção)**

**Criar tabela de sessão:**
```sql
CREATE TABLE public.sessao_revisao_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id),
  modo TEXT NOT NULL,
  cards_vistos JSONB DEFAULT '[]'::jsonb,  -- Array de flashcard_ids
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours')
);

CREATE INDEX idx_sessao_revisao_aluno 
ON sessao_revisao_flashcards(aluno_id, expires_at);
```

**Fluxo:**
1. Frontend cria sessão: `POST /api/flashcards/sessao/iniciar`
2. Backend retorna `sessionId`
3. Frontend passa `sessionId` em todas as requisições
4. Backend filtra cards já vistos na sessão
5. Frontend finaliza: `POST /api/flashcards/sessao/finalizar`

**Vantagens:**
- ✅ Persistente (sobrevive a reload)
- ✅ Funciona entre dispositivos (se compartilhar sessionId)
- ✅ Pode expirar automaticamente (TTL)

**Desvantagens:**
- ⚠️ Requer nova tabela
- ⚠️ Mais complexo de implementar

#### ✅ **Solução 3: Híbrida (Recomendada para MVP)**

**Combinar Solução 1 + Cache de curta duração:**

```typescript
// Backend: Adicionar parâmetro opcional
GET /api/flashcards/revisao?modo=...&excludeIds=id1,id2,id3

// Frontend: Passar IDs já vistos
const excludeIds = Array.from(cardsVistos).join(',');
const response = await fetch(`/api/flashcards/revisao?modo=${modo}&excludeIds=${excludeIds}`);
```

**Vantagens:**
- ✅ Simples (apenas filtro na query)
- ✅ Funciona para sessões longas
- ✅ Não requer nova tabela
- ✅ Performance boa (filtro no WHERE)

### 4.5. Recomendação Final

**✅ Para MVP: Usar Solução 3 (Híbrida)**

**Implementação:**
```typescript
// backend/services/flashcards/flashcards.service.ts

async listForReview(
  alunoId: string,
  modo: string,
  filters?: { cursoId?: string; frenteId?: string; moduloId?: string },
  excludeIds?: string[]  // ← Novo parâmetro
): Promise<FlashcardReviewItem[]> {
  // ...
  
  const dueCards = cards.filter((card) => {
    // Filtro existente
    const progress = progressMap.get(card.id);
    if (!progress) return true;
    const nextDate = progress.data_proxima_revisao
      ? new Date(progress.data_proxima_revisao)
      : null;
    if (nextDate && nextDate > now) return false;
    
    // Novo filtro: excluir IDs já vistos
    if (excludeIds && excludeIds.includes(card.id)) return false;
    
    return true;
  });
  
  // ...
}
```

**Evolução Futura:**
- Se necessário, implementar Solução 2 (sessão persistente)
- Para casos de uso avançados (multi-device, analytics)

---

## 📋 Resumo Executivo

### 1. Estrutura de Persistência
**✅ SUFICIENTE** - Campos necessários já existem. Opcional: adicionar `sequencia_acertos` para maior precisão.

### 2. Query "UTI dos Erros"
**✅ RECOMENDAÇÃO:** Query simples com ordenação por prioridade (erros primeiro). Índice composto em `(aluno_id, ultimo_feedback, data_proxima_revisao)`.

### 3. Lógica de Agendamento
**✅ RECOMENDAÇÃO:** Manter no Backend, mas refatorar em módulo dedicado (`srs-algorithm.ts`) para facilitar manutenção e testes.

### 4. Contexto de Sessão
**✅ RECOMENDAÇÃO:** Adicionar parâmetro `excludeIds` na query para evitar repetição de cards na mesma sessão. Evoluir para sessão persistente se necessário.

---

## 🚀 Próximos Passos

1. **Refatorar algoritmo SRS** em módulo dedicado
2. **Implementar query "UTI"** com ordenação ponderada
3. **Adicionar filtro `excludeIds`** no endpoint de revisão
4. **Criar índices** para otimizar queries
5. **Adicionar testes unitários** para algoritmo SRS

---

**Última atualização:** 2025-01-31  
**Versão:** 1.0.0
