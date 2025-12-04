# Plano de Implementação: Sala de Estudos

## 📋 1. Contexto e Requisitos

### 1.1 Objetivo
Criar a página "Sala de Estudos" (`/aluno/sala-de-estudos`) onde alunos podem:
- Visualizar atividades dos cursos/disciplinas em que estão matriculados
- Ver PDFs das atividades disponíveis
- Marcar progresso (checklist) das atividades
- Acompanhar status (Pendente/Iniciado/Concluído)

### 1.2 Estrutura de Dados
- **Aluno** → `matriculas` (ativo) → **Curso** → `cursos_disciplinas` → **Disciplina** → **Frente** → **Módulo** → **Atividade**
- **Progresso**: `progresso_atividades` (aluno_id + atividade_id) com status, datas, etc.

### 1.3 Dados Existentes
- ✅ Tabela `atividades` criada (91 atividades, 5 com arquivo)
- ✅ Tabela `progresso_atividades` criada (para checklist)
- ✅ Service layer de atividades
- ✅ APIs de atividades

---

## 🎯 2. Funcionalidades a Implementar

### 2.1 Backend

#### 2.1.1 Service Layer - Progresso de Atividades
**Arquivo**: `backend/services/progresso-atividade/`

- **Types**: `progresso-atividade.types.ts`
  - `StatusAtividade`: 'Pendente' | 'Iniciado' | 'Concluido'
  - `DificuldadePercebida`: enum
  - `ProgressoAtividade`: interface completa
  - `CreateProgressoInput`: para criar progresso
  - `UpdateProgressoInput`: para atualizar status/dados

- **Repository**: `progresso-atividade.repository.ts`
  - `findByAlunoAndAtividade(alunoId, atividadeId)`
  - `listByAluno(alunoId)` - todas atividades do aluno
  - `create(payload)` - criar registro de progresso
  - `update(id, payload)` - atualizar status/progresso
  - `findOrCreateProgresso(alunoId, atividadeId)` - busca ou cria se não existir

- **Service**: `progresso-atividade.service.ts`
  - `getProgressoByAluno(alunoId)` - lista todas com atividades
  - `updateStatus(alunoId, atividadeId, status)` - atualizar status
  - `marcarComoIniciado(alunoId, atividadeId)`
  - `marcarComoConcluido(alunoId, atividadeId)`
  - `updateProgresso(id, payload)` - atualizar dados completos

- **Errors**: `progresso-atividade.errors.ts`
  - `ProgressoNotFoundError`
  - `ProgressoValidationError`

- **Index**: `index.ts` - exports e singleton

#### 2.1.2 Service Layer - Atividades do Aluno (Extensão)
**Arquivo**: `backend/services/atividade/atividade.service.ts` (adicionar métodos)

- `listByAlunoMatriculas(alunoId)` - busca atividades dos cursos matriculados
  - Busca matrículas ativas do aluno
  - Busca disciplinas dos cursos
  - Busca frentes das disciplinas
  - Busca módulos das frentes
  - Busca atividades dos módulos
  - Retorna agrupado por curso > disciplina > frente > módulo

#### 2.1.3 API Routes

**Arquivo**: `app/api/progresso-atividade/route.ts`
- `GET ?alunoId={id}` - Listar progresso do aluno (com atividades)

**Arquivo**: `app/api/progresso-atividade/[id]/route.ts`
- `GET [id]` - Buscar progresso específico
- `PATCH [id]` - Atualizar progresso

**Arquivo**: `app/api/progresso-atividade/atividade/[atividadeId]/route.ts`
- `PATCH ?alunoId={id}` - Atualizar progresso de uma atividade (por atividadeId)

**Arquivo**: `app/api/atividade/aluno/[alunoId]/route.ts`
- `GET` - Listar atividades do aluno (agrupadas por estrutura)

### 2.2 Frontend

#### 2.2.1 Tipos
**Arquivo**: `app/(dashboard)/aluno/sala-de-estudos/types.ts`
- `AtividadeComProgresso`: Atividade + ProgressoAtividade
- `ModuloComAtividades`: Módulo + AtividadesComProgresso[]
- `FrenteComModulos`: Frente + ModulosComAtividades[]
- `DisciplinaComFrentes`: Disciplina + FrentesComModulos[]
- `CursoComDisciplinas`: Curso + DisciplinasComFrentes[]

#### 2.2.2 Componentes

**Arquivo**: `components/sala-estudos-filters.tsx`
- Filtros: Curso > Disciplina > Frente
- Baseado na página de materiais (reutilizar lógica)

**Arquivo**: `components/atividade-checklist-row.tsx`
- Linha de atividade com:
  - Título e tipo
  - Checkbox para marcar como concluído
  - Botão "Iniciar" se pendente
  - **Botão "Visualizar PDF"**:
    - ✅ Se `arquivo_url` existe: Botão habilitado, ícone `Eye`, abre em nova aba
    - ❌ Se `arquivo_url` é null: Botão desabilitado, ícone `FileX`, tooltip "Arquivo ainda não disponível"
  - Indicador de status (Pendente/Iniciado/Concluído)
  - Data de início/conclusão (se houver)

**Arquivo**: `components/modulo-activities-accordion.tsx`
- Accordion por módulo
- Lista de `AtividadeChecklistRow` (ordenada por `ordem_exibicao`)
- **Contador**: X/Y atividades concluídas
  - X = atividades concluídas neste módulo (filtrado se houver)
  - Y = total de atividades deste módulo (filtrado se houver)

**Arquivo**: `components/progresso-stats-card.tsx`
- Card com estatísticas:
  - **Total de atividades** (considerar filtros ativos)
  - **Pendentes** (filtradas)
  - **Iniciadas** (filtradas)
  - **Concluídas** (filtradas)
  - **Percentual de conclusão** (concluídas / total filtrado)
  - **Informação adicional**: Se houver filtros, mostrar "de X totais" (total geral sem filtros)

#### 2.2.3 Páginas

**Arquivo**: `app/(dashboard)/aluno/sala-de-estudos/page.tsx`
- Server Component - Verificação de autenticação

**Arquivo**: `app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx`
- Client Component principal
- Carrega atividades do aluno
- Orquestra componentes
- Gerencia estados (loading, errors)

---

## 📊 3. Estrutura da Interface

### 3.1 Layout
```
┌─────────────────────────────────────────┐
│  Sala de Estudos                        │
│  [Estatísticas]                         │
├─────────────────────────────────────────┤
│  [Filtros: Curso > Disciplina > Frente] │
├─────────────────────────────────────────┤
│  Curso: X                               │
│  ├─ Disciplina: Y                       │
│  │  ├─ Frente: Z                        │
│  │  │  └─ [Accordion] Módulo 1          │
│  │  │     ├─ ☐ Atividade 1 [Visualizar]│
│  │  │     ├─ ✓ Atividade 2 [Visualizar]│
│  │  │     └─ ☐ Atividade 3 [Visualizar]│
└─────────────────────────────────────────┘
```

### 3.2 Estados das Atividades
- **Pendente** (cinza): Checkbox vazio, botão "Iniciar"
- **Iniciado** (azul): Checkbox parcial, mostra data de início
- **Concluído** (verde): Checkbox marcado, mostra data de conclusão
- **Visualizar PDF**:
  - ✅ **Com arquivo**: Botão habilitado, ícone `Eye`, texto "Visualizar PDF"
  - ❌ **Sem arquivo**: Botão desabilitado, ícone `FileX`, texto "PDF não disponível", tooltip explicativo

---

## 🔧 4. Fluxos Principais

### 4.1 Carregar Atividades
1. Buscar matrículas **ativas** do aluno (autenticado)
   - ⚠️ **CRÍTICO**: Filtrar apenas `mat.ativo = true`
   - Excluir alunos que cancelaram ou trancaram cursos
   - Validar também `data_inicio_acesso` e `data_fim_acesso` se necessário
2. Para cada curso matriculado:
   - Buscar disciplinas do curso
   - Para cada disciplina:
     - Buscar frentes
     - Para cada frente:
       - Buscar módulos (ordenados por `numero_modulo ASC`)
       - Para cada módulo:
         - Buscar atividades (ordenadas por `ordem_exibicao ASC`)
         - Buscar progresso do aluno para cada atividade
3. Agrupar e retornar estrutura hierárquica
   - Manter ordem didática: módulos por número, atividades por ordem_exibicao

### 4.2 Marcar como Iniciado
1. Aluno clica em "Iniciar"
2. Criar ou atualizar `progresso_atividades`:
   - `status = 'Iniciado'`
   - `data_inicio = NOW()`
3. Atualizar UI otimisticamente

### 4.3 Marcar como Concluído
1. Aluno marca checkbox ou clica "Concluir"
2. Atualizar `progresso_atividades`:
   - `status = 'Concluido'`
   - `data_conclusao = NOW()`
   - Se não tiver `data_inicio`, definir como NOW()
3. Atualizar UI e estatísticas

### 4.4 Visualizar PDF
1. Aluno clica em "Visualizar PDF"
2. Abrir PDF em nova aba usando `arquivo_url`

---

## 🔒 5. Segurança e Validações

### 5.1 RLS (Já Configurado)
- ✅ Aluno vê apenas seu progresso
- ✅ Aluno atualiza apenas seu progresso
- ✅ Atividades são públicas (SELECT)

### 5.2 Validações
- ✅ **CRÍTICO**: Verificar se aluno está matriculado com `mat.ativo = true`
- ✅ Verificar se matrícula está dentro do período de acesso (`data_inicio_acesso` e `data_fim_acesso`)
- Verificar se atividade existe antes de criar progresso
- Validar status transitions (Pendente → Iniciado → Concluído)
- Validar datas (data_conclusao >= data_inicio)

### 5.3 Refinamentos Importantes

#### 5.3.1 Validação de Matrícula Ativa
- ⚠️ **SEMPRE** filtrar apenas `mat.ativo = true` em todas as queries
- Excluir cursos cancelados ou trancados
- Considerar período de acesso (opcional, mas recomendado)

#### 5.3.2 Tratamento Visual de Atividades Sem Arquivo
- Quando `arquivo_url` é `null`:
  - Botão "Visualizar PDF" **desabilitado**
  - Ícone `FileX` (não `Eye`)
  - Texto "PDF não disponível"
  - Tooltip: "Arquivo ainda não disponível"
  - Estilo visual diferenciado (cinza, opaco)

#### 5.3.3 Contadores de Progresso Contextuais
- **Estatísticas do ProgressoStatsCard**:
  - Total/Pendentes/Iniciadas/Concluídas: baseado no que está sendo exibido (filtrado)
  - Se houver filtros ativos: mostrar "X de Y totais" (Y = total sem filtros)
- **Contadores dos Accordions**:
  - X/Y atividades concluídas
  - X = concluídas no módulo (filtrado)
  - Y = total no módulo (filtrado)

#### 5.3.4 Ordenação Didática Rigorosa
- **Backend**: Query SQL deve ordenar por:
  - `c.nome ASC` (cursos)
  - `d.nome ASC` (disciplinas)
  - `f.nome ASC` (frentes)
  - `COALESCE(m.numero_modulo, 0) ASC` (módulos - ordem didática)
  - `COALESCE(a.ordem_exibicao, 0) ASC` (atividades - ordem didática)
- **Frontend**: Respeitar a ordem retornada pelo backend
- Não reordenar no frontend a menos que seja explicitamente necessário
- Usar `COALESCE` para tratar valores null (colocar no final)

---

## 📁 6. Estrutura de Arquivos

### Backend
```
backend/services/progresso-atividade/
  ├── progresso-atividade.types.ts
  ├── progresso-atividade.repository.ts
  ├── progresso-atividade.service.ts
  ├── progresso-atividade.errors.ts
  └── index.ts

backend/services/atividade/
  └── atividade.service.ts (adicionar métodos)
```

### API Routes
```
app/api/progresso-atividade/
  ├── route.ts
  ├── [id]/route.ts
  └── atividade/[atividadeId]/route.ts

app/api/atividade/
  └── aluno/[alunoId]/route.ts
```

### Frontend
```
app/(dashboard)/aluno/sala-de-estudos/
  ├── page.tsx
  ├── sala-estudos-client.tsx
  └── types.ts

components/
  ├── sala-estudos-filters.tsx
  ├── atividade-checklist-row.tsx
  ├── modulo-activities-accordion.tsx
  └── progresso-stats-card.tsx
```

---

## 🎨 7. Componentes UI Necessários

### 7.1 Shadcn UI
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Checkbox` (para marcar como concluído)
- `Button` (Iniciar, Visualizar)
- `Badge` (status: Pendente/Iniciado/Concluído)
- `Progress` (barra de progresso)
- `Select` (filtros)

### 7.2 Ícones Lucide
- `CheckCircle2` (concluído)
- `Circle` (pendente)
- `PlayCircle` (iniciado)
- `FileText` (PDF)
- `Eye` (visualizar PDF quando disponível)
- `FileX` (PDF não disponível)
- `BookOpen` (atividade)
- `TrendingUp` (estatísticas)

---

## 🚀 8. Ordem de Execução

### Fase 1: Backend - Service Layer
1. Criar types de progresso
2. Criar repository de progresso
3. Criar service de progresso
4. Criar errors de progresso
5. Adicionar métodos no atividade.service para listar por aluno

### Fase 2: Backend - API Routes
1. Criar `GET /api/progresso-atividade?alunoId={id}`
2. Criar `GET /api/progresso-atividade/[id]`
3. Criar `PATCH /api/progresso-atividade/[id]`
4. Criar `PATCH /api/progresso-atividade/atividade/[atividadeId]`
5. Criar `GET /api/atividade/aluno/[alunoId]`

### Fase 3: Frontend - Types e Componentes Base
1. Criar types do frontend
2. Criar `AtividadeChecklistRow`
3. Criar `ModuloActivitiesAccordion`
4. Criar `SalaEstudosFilters`
5. Criar `ProgressoStatsCard`

### Fase 4: Frontend - Página Principal
1. Criar `page.tsx` (Server Component)
2. Criar `sala-estudos-client.tsx` (Client Component)
3. Integrar todos os componentes
4. Implementar lógica de carregamento
5. Implementar atualização de progresso

### Fase 5: Testes e Ajustes
1. Testar carregamento de atividades
2. Testar marcação de progresso
3. Testar filtros
4. Testar visualização de PDFs
5. Ajustes de UX/UI

---

## 📝 9. Detalhes Técnicos

### 9.1 Queries Complexas
**Buscar atividades do aluno:**
```sql
SELECT 
  a.*,
  m.nome as modulo_nome,
  m.numero_modulo, -- Importante para ordenação didática
  f.nome as frente_nome,
  d.nome as disciplina_nome,
  c.nome as curso_nome,
  pa.status,
  pa.data_inicio,
  pa.data_conclusao
FROM atividades a
JOIN modulos m ON a.modulo_id = m.id
JOIN frentes f ON m.frente_id = f.id
JOIN disciplinas d ON f.disciplina_id = d.id
JOIN cursos_disciplinas cd ON d.id = cd.disciplina_id
JOIN cursos c ON cd.curso_id = c.id
JOIN matriculas mat ON c.id = mat.curso_id
LEFT JOIN progresso_atividades pa ON a.id = pa.atividade_id AND pa.aluno_id = :aluno_id
WHERE mat.aluno_id = :aluno_id
  AND mat.ativo = true  -- ⚠️ CRÍTICO: Apenas matrículas ativas
  -- Opcional: Validar período de acesso
  -- AND CURRENT_DATE BETWEEN mat.data_inicio_acesso AND mat.data_fim_acesso
ORDER BY 
  c.nome ASC,                    -- Ordenação por curso
  d.nome ASC,                    -- Ordenação por disciplina
  f.nome ASC,                    -- Ordenação por frente
  COALESCE(m.numero_modulo, 0) ASC,  -- ⚠️ CRÍTICO: Ordenação didática dos módulos
  a.ordem_exibicao ASC          -- ⚠️ CRÍTICO: Ordenação didática das atividades
```

**Observações importantes:**
- ✅ Usar `COALESCE(m.numero_modulo, 0)` para tratar módulos sem número
- ✅ Usar `COALESCE(a.ordem_exibicao, 0)` para tratar atividades sem ordem
- ✅ Garantir que `mat.ativo = true` está sempre presente
- ✅ A ordenação deve ser respeitada rigorosamente no frontend

### 9.2 Performance
- Buscar todas atividades de uma vez (com progresso)
- Agrupar no frontend (melhor UX)
- Usar índices existentes
- Cache de progresso (opcional - futuro)

### 9.3 UX/UI
- Loading states para cada operação
- Feedback visual imediato (otimistic updates)
- Mensagens de erro claras
- Empty states (quando não há atividades)
- Animações suaves nas transições
- **Tratamento visual para atividades sem arquivo**:
  - Botão "Visualizar PDF" desabilitado
  - Ícone `FileX` em vez de `Eye`
  - Tooltip explicativo: "Arquivo ainda não disponível"
  - Texto em cinza para indicar indisponibilidade
- **Contadores contextuais**:
  - Mostrar estatísticas do que está sendo exibido (com filtros)
  - Indicar "de X totais" quando houver filtros ativos

---

## ✅ 10. Checklist de Implementação

### Backend
- [ ] Types de progresso criados
- [ ] Repository de progresso implementado
- [ ] Service de progresso implementado
- [ ] Errors de progresso criados
- [ ] Método listByAlunoMatriculas no atividade.service
- [ ] API GET progresso do aluno
- [ ] API PATCH progresso
- [ ] API GET atividades do aluno

### Frontend
- [ ] Types do frontend criados
- [ ] Componente AtividadeChecklistRow
- [ ] Componente ModuloActivitiesAccordion
- [ ] Componente SalaEstudosFilters
- [ ] Componente ProgressoStatsCard
- [ ] Página Server Component
- [ ] Página Client Component
- [ ] Integração completa

### Testes
- [ ] Carregar atividades
- [ ] Marcar como iniciado
- [ ] Marcar como concluído
- [ ] Visualizar PDF (com arquivo)
- [ ] Testar atividade sem arquivo (botão desabilitado)
- [ ] Filtros funcionando
- [ ] Estatísticas atualizando (com e sem filtros)
- [ ] Contadores contextuais corretos
- [ ] Ordenação didática respeitada (módulos e atividades)
- [ ] Validação de matrícula ativa (não mostrar cursos inativos)
- [ ] Empty states
- [ ] Error handling

---

## 🎯 11. Próximos Passos Após Implementação

1. Adicionar funcionalidades extras:
   - Anotações pessoais (já existe campo no banco)
   - Dificuldade percebida (já existe campo no banco)
   - Questões totais/acertos (já existe campo no banco)

2. Melhorias futuras:
   - Busca de atividades
   - Ordenação customizada
   - Filtro por status
   - Exportar progresso
   - Gráficos de progresso

---

## 📋 Resumo Executivo

**Objetivo**: Implementar página completa "Sala de Estudos" para alunos visualizarem e gerenciarem progresso em atividades.

**Escopo**: 
- Backend: Service layer de progresso + APIs
- Frontend: Página completa com checklist e visualização

**Tempo Estimado**: ~8-10 horas de desenvolvimento

**Complexidade**: Média-Alta (queries complexas, múltiplos componentes, estados)

**Dependências**: 
- ✅ Tabelas já criadas
- ✅ Backend de atividades funcionando
- ⏳ Precisa implementar backend de progresso
- ⏳ Precisa implementar frontend completo

---

**Status**: 📝 Plano criado - Aguardando aprovação para iniciar implementação

