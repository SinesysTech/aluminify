# 📋 Resumo Executivo: Check Qualificado com Modal de Desempenho

## 🎯 Objetivo

Implementar um sistema de "Check Qualificado" onde atividades que requerem métricas detalhadas (questões, acertos, dificuldade) devem ser concluídas através de um modal que coleta essas informações, ao invés de um simples clique no checkbox.

---

## 🔑 Regras de Negócio

### Check Simples (Sem Modal)
✅ Atividades que podem ser concluídas com um clique direto:
- `Conceituario`
- `Revisao`

### Check Qualificado (EXIGE Modal)
🔒 Atividades que **OBRIGATORIAMENTE** precisam do modal:
- `Nivel_1`, `Nivel_2`, `Nivel_3`, `Nivel_4`
- `Lista_Mista`
- `Simulado_Diagnostico`, `Simulado_Cumulativo`, `Simulado_Global`
- `Flashcards`

---

## 🎨 Nova UX

### Fluxo de Conclusão

```
Aluno clica em "Concluir" ou marca checkbox
    ↓
Sistema verifica tipo de atividade
    ↓
┌───────────────────────────────┐
│  Tipo: Conceituario/Revisao?  │
└───────────────────────────────┘
    │                    │
    SIM                  NÃO
    ↓                    ↓
Salva direto        Abre Modal
como concluído      "Registrar Desempenho"
```

### Modal "Registrar Desempenho"

**Campos Obrigatórios**:
- 📊 **Questões Totais** (número, mínimo 1)
- ✅ **Questões Acertadas** (número, 0 a total)
- 🎚️ **Dificuldade Percebida** (select: Muito Fácil, Fácil, Médio, Difícil, Muito Difícil)

**Campos Opcionais**:
- 📝 **Anotações Pessoais** (textarea)

**Validações**:
- Acertos ≤ Totais
- Todos os campos obrigatórios preenchidos
- Botão "Salvar e Concluir" só habilita quando válido

### Visualização Pós-Conclusão

**Atividades com Check Qualificado** mostram:
- ✅ Check verde
- 🏷️ Badge: `"Acertos: 8/10"`
- 🎯 Badge de dificuldade: `"Médio"` (com cor)
- 📝 Ícone de anotações (se houver)

**Atividades com Check Simples** mostram:
- ✅ Check verde
- Sem badges extras

---

## 🏗️ Componentes a Criar/Atualizar

### 1. Novo Componente
- **`RegistrarDesempenhoModal`**: Modal com formulário completo

### 2. Componentes a Atualizar
- **`AtividadeChecklistRow`**: 
  - Lógica condicional (check simples vs qualificado)
  - Integração com modal
  - Renderização de badges com métricas

### 3. Tipos TypeScript
- Adicionar campos de desempenho ao `AtividadeComProgresso`

### 4. Backend/API
- Atualizar query para buscar campos de desempenho
- Atualizar API para salvar dados completos

---

## 📊 Campos do Banco Utilizados

A tabela `progresso_atividades` já possui todos os campos necessários:
- ✅ `questoes_totais` (INTEGER)
- ✅ `questoes_acertos` (INTEGER)
- ✅ `dificuldade_percebida` (ENUM)
- ✅ `anotacoes_pessoais` (TEXT)

---

## ✅ Checklist de Implementação

### Fase 1: Componentes UI
- [ ] Criar `RegistrarDesempenhoModal`
- [ ] Atualizar `AtividadeChecklistRow`
- [ ] Atualizar tipos TypeScript

### Fase 2: Backend
- [ ] Atualizar query de atividades
- [ ] Atualizar API de progresso
- [ ] Adicionar validações

### Fase 3: Integração
- [ ] Integrar modal no fluxo
- [ ] Testar todos os cenários
- [ ] Validar exibição de badges

---

## 🎯 Benefícios

1. ✅ **Coleta dados completos**: Aproveita todos os campos do banco
2. ✅ **Métricas detalhadas**: Permite análise de desempenho
3. ✅ **UX inteligente**: Modal só para atividades que precisam
4. ✅ **Visualização rica**: Badges mostram resultados claramente
5. ✅ **Regras claras**: Tipo de atividade define comportamento

---

## 📝 Próximos Passos

1. Revisar e aprovar o plano
2. Implementar componentes
3. Atualizar backend/API
4. Testar fluxo completo
5. Validar com usuários

---

**Status**: 📝 Plano Completo - Aguardando Aprovação  
**Prioridade**: 🔴 Alta  
**Complexidade**: Média-Alta  
**Tempo Estimado**: 4-6 horas



