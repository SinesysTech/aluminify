# 📋 Resumo Executivo: Plano Sala de Estudos

## 🎯 Objetivo

Implementar a página **"Sala de Estudos"** (`/aluno/sala-de-estudos`) onde alunos podem:
- ✅ Ver atividades dos cursos em que estão matriculados
- ✅ Visualizar PDFs das atividades
- ✅ Marcar progresso (checklist): Pendente → Iniciado → Concluído
- ✅ Acompanhar estatísticas de progresso

---

## 📊 Status Atual

### ✅ O que JÁ TEMOS:
- Tabela `atividades` (91 atividades criadas, 5 com arquivo)
- Tabela `progresso_atividades` (para checklist)
- Backend de atividades funcionando
- Frontend do professor completo (`/admin/materiais`)

### ❌ O que FALTA:
- Backend de progresso (service layer + APIs)
- Frontend completo da Sala de Estudos
- Componentes de checklist e visualização

---

## 🏗️ Arquitetura Proposta

### Backend (Novo)
```
backend/services/progresso-atividade/
  ├── progresso-atividade.types.ts
  ├── progresso-atividade.repository.ts
  ├── progresso-atividade.service.ts
  └── progresso-atividade.errors.ts

app/api/progresso-atividade/
  ├── route.ts (GET por aluno)
  ├── [id]/route.ts (GET/PATCH)
  └── atividade/[atividadeId]/route.ts (PATCH)
```

### Frontend (Novo)
```
app/(dashboard)/aluno/sala-de-estudos/
  ├── page.tsx (Server Component)
  ├── sala-estudos-client.tsx (Client Component)
  └── types.ts

components/
  ├── atividade-checklist-row.tsx
  ├── modulo-activities-accordion.tsx
  ├── sala-estudos-filters.tsx
  └── progresso-stats-card.tsx
```

---

## 🎨 Interface Proposta

```
┌─────────────────────────────────────────────┐
│  📚 Sala de Estudos                         │
├─────────────────────────────────────────────┤
│  📊 Estatísticas                            │
│  Total: 50 | Pendentes: 30 | Concluídas: 5 │
├─────────────────────────────────────────────┤
│  🔍 Filtros                                 │
│  [Curso ▼] [Disciplina ▼] [Frente ▼]       │
├─────────────────────────────────────────────┤
│  📖 Curso: Medicina 2024                    │
│  ├─ 🧬 Disciplina: Biologia                │
│  │  ├─ 📑 Frente: Citologia                │
│  │  │  └─ ▼ Módulo 1: Células             │
│  │  │     ├─ ☐ Conceituário [Visualizar]  │
│  │  │     ├─ ✓ Lista N1 [Visualizar]      │
│  │  │     └─ ☐ Lista N2 [Visualizar]      │
└─────────────────────────────────────────────┘
```

**Estados das Atividades:**
- ⚪ **Pendente**: Checkbox vazio, botão "Iniciar"
- 🔵 **Iniciado**: Checkbox parcial, mostra data
- ✅ **Concluído**: Checkbox marcado, mostra data

---

## 🔄 Fluxos Principais

### 1. Carregar Atividades
```
Aluno acessa página
  ↓
Buscar matrículas ativas
  ↓
Para cada curso matriculado:
  - Buscar disciplinas
  - Buscar frentes
  - Buscar módulos
  - Buscar atividades
  - Buscar progresso do aluno
  ↓
Agrupar e exibir
```

### 2. Marcar Progresso
```
Aluno clica "Iniciar" ou marca checkbox
  ↓
Atualizar progresso_atividades
  - Status: Pendente → Iniciado → Concluído
  - Data de início/conclusão
  ↓
Atualizar UI e estatísticas
```

---

## 📦 Componentes a Criar

### Backend
1. **Service Layer Progresso**
   - Repository pattern
   - CRUD de progresso
   - Validações

2. **API Routes**
   - GET progresso do aluno
   - PATCH atualizar progresso
   - GET atividades do aluno

### Frontend
1. **AtividadeChecklistRow**
   - Exibe atividade
   - Checkbox de status
   - Botões de ação

2. **ModuloActivitiesAccordion**
   - Accordion por módulo
   - Lista de atividades
   - Contador de progresso

3. **SalaEstudosFilters**
   - Filtros: Curso > Disciplina > Frente
   - Reutilizar lógica de materiais

4. **ProgressoStatsCard**
   - Estatísticas globais
   - Percentual de conclusão

---

## 🗂️ Ordem de Implementação

### Fase 1: Backend (Service Layer)
- [ ] Types de progresso
- [ ] Repository
- [ ] Service
- [ ] Errors

### Fase 2: Backend (APIs)
- [ ] GET progresso do aluno
- [ ] PATCH progresso
- [ ] GET atividades do aluno

### Fase 3: Frontend (Componentes)
- [ ] AtividadeChecklistRow
- [ ] ModuloActivitiesAccordion
- [ ] SalaEstudosFilters
- [ ] ProgressoStatsCard

### Fase 4: Frontend (Página)
- [ ] Server Component
- [ ] Client Component
- [ ] Integração completa

### Fase 5: Testes
- [ ] Carregamento
- [ ] Marcação de progresso
- [ ] Visualização PDF
- [ ] Filtros

---

## ⚡ Funcionalidades Principais

1. **Visualização Hierárquica**
   - Curso → Disciplina → Frente → Módulo → Atividade
   - Accordions colapsáveis
   - Organizado e navegável

2. **Checklist Interativo**
   - Marcar como iniciado
   - Marcar como concluído
   - Feedback visual imediato
   - Datas de início/conclusão

3. **Visualização de PDFs**
   - Botão "Visualizar" para cada atividade com arquivo
   - Abre em nova aba
   - URL pública do Storage

4. **Estatísticas**
   - Total de atividades
   - Pendentes/Iniciadas/Concluídas
   - Percentual de progresso
   - Atualização em tempo real

5. **Filtros**
   - Filtrar por curso
   - Filtrar por disciplina
   - Filtrar por frente
   - Cascata de filtros

---

## 🔒 Segurança

- ✅ RLS já configurado
- ✅ Aluno vê apenas seu progresso
- ✅ Aluno atualiza apenas seu progresso
- ✅ Validação de matrícula ativa

---

## 📝 Decisões Técnicas

1. **Agrupamento**: No backend (query complexa) ou frontend?
   - ✅ **Decisão**: Backend retorna estruturado, frontend apenas renderiza

2. **Progresso**: Criar automaticamente ou sob demanda?
   - ✅ **Decisão**: Criar sob demanda quando aluno marcar progresso

3. **Atualizações**: Otimistic updates?
   - ✅ **Decisão**: Sim, melhor UX

4. **Cache**: Cachear atividades?
   - ⏳ **Decisão**: Não inicialmente, adicionar depois se necessário

---

## 🎯 Resultado Esperado

Após implementação, o aluno poderá:
1. Acessar `/aluno/sala-de-estudos`
2. Ver todas atividades dos cursos matriculados
3. Organizadas por: Curso → Disciplina → Frente → Módulo
4. Marcar atividades como iniciadas/concluídas
5. Visualizar PDFs das atividades
6. Acompanhar progresso geral

---

## ⏱️ Estimativa

- **Backend**: ~4-5 horas
- **Frontend**: ~4-5 horas
- **Total**: ~8-10 horas

---

## ✅ Pronto para Implementar?

**Plano completo disponível em**: `docs/PLANO_SALA_ESTUDOS.md`

**Aguardando sua aprovação para iniciar a implementação!** 🚀



