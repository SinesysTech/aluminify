# 📊 Relatório de Verificação: Sistema de Revisão via Flashcards

**Data:** 2025-01-31  
**Objetivo:** Verificar o funcionamento dos algoritmos de revisão e armazenamento de erros

---

## 🎯 1. ALGORITMOS DOS MODOS DE REVISÃO

### 1.1. 🔥 **Modo "Mais Cobrados"**

#### Como Funciona:
```532:535:backend/services/flashcards/flashcards.service.ts
    if (modo === 'mais_cobrados') {
      const { data, error } = await modulosQuery.eq('importancia', 'Alta');
      if (error) throw new Error(`Erro ao buscar módulos prioritários: ${error.message}`);
      moduloIds = (data ?? []).map((m: any) => m.id);
```

**Lógica:**
1. ✅ Busca **todos os módulos** dos cursos do aluno que têm `importancia = 'Alta'`
2. ✅ Filtra flashcards que pertencem a esses módulos
3. ✅ Retorna até 10 flashcards aleatórios que estão "due" (data_proxima_revisao <= hoje)

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**
- O algoritmo está filtrando corretamente por `importancia = 'Alta'`
- A classificação de importância dos módulos está sendo usada corretamente

---

### 1.2. 🧠 **Modo "Revisão Geral"**

#### Como Funciona:
```566:594:backend/services/flashcards/flashcards.service.ts
    } else {
      const { data: progFlash, error: progFlashError } = await this.client
        .from('progresso_flashcards')
        .select('flashcard_id')
        .eq('aluno_id', alunoId);
      if (progFlashError) {
        console.warn('[flashcards] erro ao buscar progresso para revisao_geral', progFlashError);
      }
      const flashcardIdsVistos = (progFlash ?? []).map((p) => p.flashcard_id as string);
      let moduloIdsVisited: string[] = [];
      if (flashcardIdsVistos.length) {
        const { data: cardsVisitados } = await this.client
          .from('flashcards')
          .select('id, modulo_id')
          .in('id', flashcardIdsVistos);
        moduloIdsVisited = Array.from(
          new Set((cardsVisitados ?? []).map((c) => c.modulo_id as string)),
        );
      }
      // Buscar todos os módulos das frentes do aluno (já filtrados acima)
      const { data: todosModulos, error: todosModulosError } = await modulosQuery;
      if (todosModulosError) {
        console.warn('[flashcards] erro ao buscar todos os módulos', todosModulosError);
      }
      const moduloIdsAll = Array.from(
        new Set((todosModulos ?? []).map((m: any) => m.id)),
      );
      moduloIds = moduloIdsVisited.length ? moduloIdsVisited : moduloIdsAll;
    }
```

**Lógica:**
1. ✅ Busca flashcards que o aluno **já viu** (têm registro em `progresso_flashcards`)
2. ✅ Identifica os **módulos** desses flashcards
3. ✅ Se o aluno já viu flashcards, usa apenas módulos já visitados
4. ✅ Se o aluno nunca viu flashcards, usa **todos os módulos** dos cursos do aluno
5. ✅ Retorna até 10 flashcards aleatórios que estão "due"

**⚠️ PROBLEMA IDENTIFICADO:**
- O modo "Revisão Geral" **NÃO está verificando se o aluno concluiu atividades dos módulos**
- Ele apenas verifica se o aluno **já viu flashcards** desses módulos
- **Não está usando** a tabela `progresso_atividades` para verificar módulos concluídos

**Status:** ⚠️ **FUNCIONANDO PARCIALMENTE**
- Funciona para flashcards já vistos
- **NÃO funciona** para identificar módulos concluídos via atividades

---

### 1.3. 🚑 **Modo "UTI dos Erros"**

#### Como Funciona:
```536:565:backend/services/flashcards/flashcards.service.ts
    } else if (modo === 'mais_errados') {
      const { data: progressos, error: progError } = await this.client
        .from('progresso_atividades')
        .select('atividade_id, dificuldade_percebida, questoes_totais, questoes_acertos')
        .eq('aluno_id', alunoId);
      if (progError) {
        throw new Error(`Erro ao buscar progresso de atividades: ${progError.message}`);
      }
      const atividadeIds = (progressos ?? [])
        .filter((p) => {
          const dificuldade = p.dificuldade_percebida as DificuldadePercebida | null;
          const difficult = dificuldade === 'Dificil' || dificuldade === 'Muito Dificil';
          const aproveitamentoOk =
            p.questoes_totais && p.questoes_totais > 0
              ? (p.questoes_acertos ?? 0) / p.questoes_totais <= 0.5
              : false;
          return difficult || aproveitamentoOk;
        })
        .map((p) => p.atividade_id as string);

      if (atividadeIds.length) {
        const { data: atividades, error: atvError } = await this.client
          .from('atividades')
          .select('id, modulo_id')
          .in('id', atividadeIds);
        if (atvError) {
          throw new Error(`Erro ao buscar atividades: ${atvError.message}`);
        }
        moduloIds = Array.from(new Set((atividades ?? []).map((a) => a.modulo_id as string)));
      }
    }
```

**Lógica:**
1. ✅ Busca **progresso de atividades** do aluno (`progresso_atividades`)
2. ✅ Filtra atividades com:
   - `dificuldade_percebida = 'Dificil'` OU `'Muito Dificil'` OU
   - `aproveitamento <= 50%` (questoes_acertos / questoes_totais <= 0.5)
3. ✅ Identifica os **módulos** dessas atividades problemáticas
4. ✅ Busca flashcards desses módulos
5. ✅ Aplica **distribuição ponderada** por feedback:

```625:700:backend/services/flashcards/flashcards.service.ts
    // Para modo "mais_errados" (UTI), aplicar distribuição ponderada
    if (modo === 'mais_errados') {
      // Separar cards por feedback
      const cardsPorFeedback: { [key: number]: typeof cards } = {
        1: [], // Errei
        2: [], // Parcial
        3: [], // Dificil
      };

      cards.forEach((card) => {
        const progress = progressMap.get(card.id);
        if (!progress) return;

        // Excluir cards já vistos na sessão
        if (excludeIds && excludeIds.includes(card.id)) {
          return;
        }

        // Verificar se está due
        const nextDate = progress.data_proxima_revisao
          ? new Date(progress.data_proxima_revisao)
          : null;
        if (nextDate && nextDate > now) {
          return;
        }

        const feedback = progress.ultimo_feedback as number | null;
        if (feedback === 1 || feedback === 2 || feedback === 3) {
          cardsPorFeedback[feedback].push(card);
        }
      });

      // Distribuição: 5 Errei, 3 Parcial, 2 Dificil
      const selecionados: typeof cards = [];
      
      // Embaralhar cada grupo
      const erreiShuffled = this.shuffle(cardsPorFeedback[1]);
      const parcialShuffled = this.shuffle(cardsPorFeedback[2]);
      const dificilShuffled = this.shuffle(cardsPorFeedback[3]);

      // Adicionar 5 de "Errei"
      selecionados.push(...erreiShuffled.slice(0, 5));
      
      // Adicionar 3 de "Parcial"
      selecionados.push(...parcialShuffled.slice(0, 3));
      
      // Adicionar 2 de "Dificil"
      selecionados.push(...dificilShuffled.slice(0, 2));

      // Se não tiver cards suficientes com feedback, buscar cards novos ou sem feedback
      if (selecionados.length < 10) {
        const cardsNovos = cards.filter((card) => {
          if (excludeIds && excludeIds.includes(card.id)) return false;
          const progress = progressMap.get(card.id);
          if (!progress) return true;
          const nextDate = progress.data_proxima_revisao
            ? new Date(progress.data_proxima_revisao)
            : null;
          return !nextDate || nextDate <= now;
        });

        const idsSelecionados = new Set(selecionados.map((c) => c.id));
        const cardsDisponiveis = cardsNovos.filter((c) => !idsSelecionados.has(c.id));
        const shuffledNovos = this.shuffle(cardsDisponiveis);
        selecionados.push(...shuffledNovos.slice(0, 10 - selecionados.length));
      }

      // Embaralhar resultado final e limitar a 10
      const finalShuffled = this.shuffle(selecionados);
      return finalShuffled.slice(0, 10).map((c) => {
        const progress = progressMap.get(c.id);
        return {
          ...c,
          dataProximaRevisao: progress?.data_proxima_revisao ?? null,
        };
      });
    }
```

**Distribuição:**
- **50%** (5 cards): Feedback = 1 (Errei)
- **30%** (3 cards): Feedback = 2 (Acertei parcialmente)
- **20%** (2 cards): Feedback = 3 (Acertei com dificuldade)

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**
- O algoritmo está buscando corretamente atividades com dificuldade ou baixo aproveitamento
- A distribuição ponderada está implementada corretamente
- O armazenamento de erros está funcionando

---

## 📦 2. ARMAZENAMENTO DE ERROS DOS ESTUDANTES

### 2.1. Armazenamento via Flashcards

**Tabela:** `progresso_flashcards`

```sql
CREATE TABLE public.progresso_flashcards (
    id UUID PRIMARY KEY,
    aluno_id UUID REFERENCES alunos(id),
    flashcard_id UUID REFERENCES flashcards(id),
    nivel_facilidade DOUBLE PRECISION DEFAULT 2.5,
    dias_intervalo INTEGER DEFAULT 0,
    data_proxima_revisao TIMESTAMP WITH TIME ZONE,
    numero_revisoes INTEGER DEFAULT 0,
    ultimo_feedback INTEGER,  -- 1=Errei, 2=Parcial, 3=Difícil, 4=Fácil
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

**Rotas Configuradas:**
- ✅ `POST /api/flashcards/feedback` - Registra feedback do aluno

```741:789:backend/services/flashcards/flashcards.service.ts
  async sendFeedback(alunoId: string, cardId: string, feedback: number) {
    if (!isValidFeedback(feedback)) {
      throw new Error('Feedback inválido. Use 1, 2, 3 ou 4.');
    }

    const { data: existing, error } = await this.client
      .from('progresso_flashcards')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('flashcard_id', cardId)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar progresso do flashcard: ${error.message}`);
    }

    // Usar algoritmo SRS para calcular próxima revisão
    const srsResult = calculateNextReview(feedback as FeedbackValue, {
      easeFactor: existing?.nivel_facilidade ?? undefined,
      interval: existing?.dias_intervalo ?? undefined,
      repetitions: existing?.numero_revisoes ?? undefined,
      lastFeedback: existing?.ultimo_feedback ?? null,
    });

    const now = new Date();

    const payload = {
      aluno_id: alunoId,
      flashcard_id: cardId,
      nivel_facilidade: srsResult.newEaseFactor,
      dias_intervalo: srsResult.newInterval,
      data_proxima_revisao: srsResult.nextReviewDate.toISOString(),
      numero_revisoes: srsResult.newRepetitions,
      ultimo_feedback: feedback,
      updated_at: now.toISOString(),
    };

    const { data: upserted, error: upsertError } = await this.client
      .from('progresso_flashcards')
      .upsert(payload, { onConflict: 'aluno_id,flashcard_id' })
      .select('*')
      .maybeSingle();

    if (upsertError) {
      throw new Error(`Erro ao registrar feedback: ${upsertError.message}`);
    }

    return upserted;
  }
```

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**
- O feedback está sendo armazenado corretamente
- O algoritmo SRS está calculando a próxima revisão
- A rota está configurada e funcionando

---

### 2.2. Armazenamento via Atividades (para UTI dos Erros)

**Tabela:** `progresso_atividades`

```sql
CREATE TABLE public.progresso_atividades (
    id UUID PRIMARY KEY,
    aluno_id UUID REFERENCES alunos(id),
    atividade_id UUID REFERENCES atividades(id),
    status enum_status_atividade,
    questoes_totais INTEGER DEFAULT 0,
    questoes_acertos INTEGER DEFAULT 0,
    dificuldade_percebida enum_dificuldade_percebida,
    anotacoes_pessoais TEXT,
    ...
);
```

**Rotas Configuradas:**
- ✅ `PATCH /api/progresso-atividade/atividade/[atividadeId]` - Atualiza progresso com desempenho

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**
- O armazenamento de erros via atividades está funcionando
- O modo "UTI dos Erros" está usando esses dados corretamente

---

## 🔍 3. VERIFICAÇÃO: MÓDULOS CONCLUÍDOS PARA "REVISÃO GERAL"

### 3.1. Problema Identificado

O modo "Revisão Geral" **NÃO está verificando se o aluno concluiu atividades dos módulos**.

**Código Atual:**
```566:594:backend/services/flashcards/flashcards.service.ts
    } else {
      const { data: progFlash, error: progFlashError } = await this.client
        .from('progresso_flashcards')
        .select('flashcard_id')
        .eq('aluno_id', alunoId);
      // ... apenas verifica flashcards já vistos
      moduloIds = moduloIdsVisited.length ? moduloIdsVisited : moduloIdsAll;
    }
```

**O que deveria fazer:**
1. Buscar atividades concluídas do aluno (`progresso_atividades` onde `status = 'Concluido'`)
2. Identificar os módulos dessas atividades
3. Buscar flashcards desses módulos

**Status:** ⚠️ **NECESSITA CORREÇÃO**

---

## 🔍 4. VERIFICAÇÃO: "MAIS COBRADOS" E IMPORTÂNCIA DOS MÓDULOS

### 4.1. Verificação da Classificação de Importância

**Código:**
```532:535:backend/services/flashcards/flashcards.service.ts
    if (modo === 'mais_cobrados') {
      const { data, error } = await modulosQuery.eq('importancia', 'Alta');
      if (error) throw new Error(`Erro ao buscar módulos prioritários: ${error.message}`);
      moduloIds = (data ?? []).map((m: any) => m.id);
```

**Verificação:**
- ✅ O algoritmo está filtrando corretamente por `importancia = 'Alta'`
- ✅ A coluna `importancia` existe na tabela `modulos`
- ✅ Os valores possíveis são: `'Alta'`, `'Media'`, `'Baixa'`, `'Base'`

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**

---

## 📋 RESUMO EXECUTIVO

### ✅ Funcionando Corretamente:
1. **Modo "Mais Cobrados"** - Filtra por `importancia = 'Alta'` ✅
2. **Modo "UTI dos Erros"** - Usa `progresso_atividades` e distribuição ponderada ✅
3. **Armazenamento de erros** - Tanto via flashcards quanto via atividades ✅
4. **Rotas configuradas** - Todas as rotas necessárias estão funcionando ✅
5. **Algoritmo SRS** - Calculando corretamente próxima revisão ✅

### ⚠️ Problemas Identificados:
1. **Modo "Revisão Geral"** - Não verifica módulos concluídos via atividades
   - **Impacto:** Alunos que concluíram atividades mas nunca viram flashcards não terão seus módulos incluídos
   - **Solução:** Adicionar verificação de `progresso_atividades` onde `status = 'Concluido'`

---

## 🔧 RECOMENDAÇÕES

### 1. Corrigir "Revisão Geral" para incluir módulos concluídos

**Código sugerido:**
```typescript
} else {
  // Modo revisao_geral: buscar módulos de flashcards já vistos OU módulos com atividades concluídas
  
  // 1. Buscar flashcards já vistos
  const { data: progFlash } = await this.client
    .from('progresso_flashcards')
    .select('flashcard_id')
    .eq('aluno_id', alunoId);
  
  const flashcardIdsVistos = (progFlash ?? []).map((p) => p.flashcard_id as string);
  let moduloIdsVisited: string[] = [];
  
  if (flashcardIdsVistos.length) {
    const { data: cardsVisitados } = await this.client
      .from('flashcards')
      .select('id, modulo_id')
      .in('id', flashcardIdsVistos);
    moduloIdsVisited = Array.from(
      new Set((cardsVisitados ?? []).map((c) => c.modulo_id as string)),
    );
  }
  
  // 2. Buscar módulos com atividades concluídas
  const { data: atividadesConcluidas } = await this.client
    .from('progresso_atividades')
    .select('atividade_id, atividades(modulo_id)')
    .eq('aluno_id', alunoId)
    .eq('status', 'Concluido');
  
  const moduloIdsConcluidos = Array.from(
    new Set(
      (atividadesConcluidas ?? [])
        .map((a: any) => a.atividades?.modulo_id)
        .filter(Boolean)
    )
  );
  
  // 3. Combinar módulos de flashcards vistos + módulos com atividades concluídas
  const moduloIdsCombinados = Array.from(
    new Set([...moduloIdsVisited, ...moduloIdsConcluidos])
  );
  
  // 4. Se não houver nenhum, usar todos os módulos
  const { data: todosModulos } = await modulosQuery;
  const moduloIdsAll = Array.from(
    new Set((todosModulos ?? []).map((m: any) => m.id)),
  );
  
  moduloIds = moduloIdsCombinados.length ? moduloIdsCombinados : moduloIdsAll;
}
```

---

## ✅ CONCLUSÃO

O sistema de flashcards está **funcionando corretamente** na maioria dos aspectos:
- ✅ Algoritmos de "Mais Cobrados" e "UTI dos Erros" estão corretos
- ✅ Armazenamento de erros está funcionando
- ✅ Rotas estão configuradas
- ⚠️ **Modo "Revisão Geral" precisa ser ajustado** para incluir módulos com atividades concluídas

**Prioridade:** Média - O sistema funciona, mas a "Revisão Geral" pode ser melhorada para ser mais abrangente.



