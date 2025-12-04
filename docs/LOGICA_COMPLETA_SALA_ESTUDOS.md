# 📚 Lógica Completa de Funcionamento: Sala de Estudos

## 🎯 Visão Geral

A **Sala de Estudos** é uma página onde **alunos** podem visualizar atividades dos cursos em que estão matriculados, e **professores** podem ver todas as atividades de todos os cursos. Os alunos podem marcar o progresso de cada atividade (Pendente → Iniciado → Concluído) e acompanhar estatísticas de conclusão.

---

## 🏗️ Arquitetura Geral

### Fluxo de Dados

```
Frontend (React/Next.js)
    ↓
Supabase Client (Browser)
    ↓
Supabase Database (PostgreSQL)
    ↓
Tabelas:
  - matriculas (matrículas ativas do aluno)
  - cursos, disciplinas, frentes, modulos
  - atividades (materiais didáticos)
  - progresso_atividades (checklist do aluno)
```

---

## 📊 Estrutura de Dados

### Hierarquia Completa

```
Aluno
  └── Matrículas (ativo = true)
      └── Curso
          └── cursos_disciplinas (relacionamento)
              └── Disciplina
                  └── Frente
                      └── Módulo
                          └── Atividade
                              └── progresso_atividades (aluno + atividade)
```

### Tabelas Principais

#### 1. `matriculas`
- **Colunas**: `id`, `aluno_id`, `curso_id`, `ativo`, `data_inicio_acesso`, `data_fim_acesso`
- **Filtro crítico**: `ativo = true` (apenas matrículas ativas)

#### 2. `atividades`
- **Colunas**: `id`, `modulo_id`, `tipo`, `titulo`, `arquivo_url`, `ordem_exibicao`
- **Tipos**: Nivel_1, Nivel_2, Lista_Mista, Simulado_Diagnostico, etc.

#### 3. `progresso_atividades`
- **Colunas**: `id`, `aluno_id`, `atividade_id`, `status`, `data_inicio`, `data_conclusao`
- **Status**: 'Pendente' | 'Iniciado' | 'Concluido'
- **Unique**: `(aluno_id, atividade_id)` - um progresso por aluno/atividade

---

## 🔄 Fluxo Completo de Funcionamento

### 1. Inicialização da Página

#### 1.1. Autenticação e Detecção de Role

**Arquivo**: `app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx`

```typescript
// Busca usuário autenticado
const { data: { user } } = await supabase.auth.getUser()

// Detecta role (aluno/professor/superadmin)
const role = user.user_metadata?.role || 'aluno'
setUserRole(role)
setAlunoId(user.id) // ID do usuário (mesmo para professores)
```

**Resultado**:
- Identifica se é aluno ou professor
- Define estratégia de busca de dados

---

### 2. Carregamento de Cursos

#### 2.1. Para Alunos

**Lógica**:
1. Busca matrículas ativas usando função RPC (evita problemas de RLS)
2. Extrai IDs dos cursos
3. Busca dados completos dos cursos

**Código**:
```typescript
// 1. Buscar matrículas ativas (via RPC)
const { data: matriculas } = await supabase
  .rpc('get_matriculas_aluno', { p_aluno_id: alunoId })

// 2. Extrair curso_ids
const cursoIds = matriculas.map((m) => m.curso_id)

// 3. Buscar cursos
const { data: cursos } = await supabase
  .from('cursos')
  .select('id, nome')
  .in('id', cursoIds)
  .order('nome', { ascending: true })
```

**Função RPC `get_matriculas_aluno`**:
```sql
CREATE FUNCTION get_matriculas_aluno(p_aluno_id UUID)
RETURNS TABLE (curso_id UUID) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT m.curso_id
  FROM public.matriculas m
  WHERE m.aluno_id = p_aluno_id
    AND m.ativo = true;  -- ⚠️ CRÍTICO: Apenas matrículas ativas
END;
$$;
```

**Por que RPC?**
- Evita problemas com políticas RLS que tentam acessar `auth.users`
- Usa `SECURITY DEFINER` para executar com privilégios elevados
- Mais seguro e eficiente

#### 2.2. Para Professores

**Lógica**:
1. Busca **todos os cursos** diretamente
2. Não precisa de matrículas

**Código**:
```typescript
if (userRole === 'professor' || userRole === 'superadmin') {
  const { data: cursosData } = await supabase
    .from('cursos')
    .select('id, nome')
    .order('nome', { ascending: true })
  
  cursoIds = cursosData?.map((c) => c.id) || []
}
```

---

### 3. Carregamento de Atividades (Query Complexa)

#### 3.1. Estratégia: Múltiplas Queries Simples

Ao invés de uma query SQL gigante com múltiplos JOINs, usamos uma abordagem de **múltiplas queries simples** que são combinadas no código TypeScript.

**Por quê?**
- Mais fácil de depurar
- Mais flexível para professores vs alunos
- Melhor performance com índices apropriados
- Evita problemas de RLS complexos

#### 3.2. Passo a Passo da Query

**Arquivo**: `app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx`

**Passo 1: Obter Cursos**
```typescript
// Para alunos: via matrículas (já obtido anteriormente)
// Para professores: todos os cursos (já obtido anteriormente)
const cursoIds = [...] // Array de UUIDs dos cursos
```

**Passo 2: Buscar Relacionamento Curso-Disciplina**
```typescript
const { data: cursosDisciplinas } = await supabase
  .from('cursos_disciplinas')
  .select('disciplina_id, curso_id')
  .in('curso_id', cursoIds)

// Extrair disciplinas únicas
const disciplinaIds = [...new Set(cursosDisciplinas.map((cd) => cd.disciplina_id))]
```

**Passo 3: Buscar Frentes**
```typescript
const { data: frentesData } = await supabase
  .from('frentes')
  .select('id, nome, disciplina_id, curso_id')
  .in('disciplina_id', disciplinaIds)

// Filtrar frentes que pertencem aos cursos do aluno/professor
const frentesFiltradas = frentesData.filter(
  (f) => !f.curso_id || cursoIds.includes(f.curso_id)
)
```

**Passo 4: Buscar Módulos**
```typescript
const { data: modulosData } = await supabase
  .from('modulos')
  .select('id, nome, numero_modulo, frente_id')
  .in('frente_id', frenteIds)
  .order('numero_modulo', { ascending: true, nullsFirst: false })
```

**Passo 5: Buscar Atividades**
```typescript
const { data: atividadesData } = await supabase
  .from('atividades')
  .select('*')
  .in('modulo_id', moduloIds)
  .order('ordem_exibicao', { ascending: true, nullsFirst: false })
```

**Passo 6: Buscar Progresso do Aluno**
```typescript
const atividadeIds = atividadesData.map((a) => a.id)

const { data: progressosData } = await supabase
  .from('progresso_atividades')
  .select('atividade_id, status, data_inicio, data_conclusao')
  .eq('aluno_id', alunoId)
  .in('atividade_id', atividadeIds)

// Criar mapa para lookup rápido
const progressosMap = new Map(
  progressosData.map((p) => [
    p.atividade_id,
    {
      status: p.status,
      dataInicio: p.data_inicio,
      dataConclusao: p.data_conclusao,
    },
  ])
)
```

**Passo 7: Buscar Informações Adicionais (Disciplinas e Cursos)**
```typescript
// Buscar disciplinas
const { data: disciplinasData } = await supabase
  .from('disciplinas')
  .select('id, nome')
  .in('id', disciplinaIds)

// Buscar cursos (para nomes completos)
const { data: cursosDataInfo } = await supabase
  .from('cursos')
  .select('id, nome')
  .in('id', cursoIds)
```

**Passo 8: Montar Estrutura Hierárquica Completa**

```typescript
const atividadesComProgresso: AtividadeComProgresso[] = []

for (const atividade of atividadesData) {
  const modulo = modulosMap.get(atividade.modulo_id)
  const frente = frentesMap.get(modulo.frente_id)
  const disciplina = disciplinasMap.get(frente.disciplina_id)
  
  // Encontrar curso que tem essa disciplina
  let cursoId = encontrarCursoPorDisciplina(...)
  
  const progresso = progressosMap.get(atividade.id)
  
  atividadesComProgresso.push({
    // Dados da atividade
    id: atividade.id,
    titulo: atividade.titulo,
    arquivoUrl: atividade.arquivo_url,
    // ... outros campos
    
    // Hierarquia
    cursoNome: cursosMap.get(cursoId).nome,
    disciplinaNome: disciplina.nome,
    frenteNome: frente.nome,
    moduloNome: modulo.nome,
    moduloNumero: modulo.numero_modulo,
    
    // Progresso
    progressoStatus: progresso?.status || null,
    progressoDataInicio: progresso?.dataInicio || null,
    progressoDataConclusao: progresso?.dataConclusao || null,
  })
}
```

**Passo 9: Ordenação Rigorosa**

```typescript
atividadesComProgresso.sort((a, b) => {
  // 1. Por curso
  if (a.cursoNome !== b.cursoNome) {
    return a.cursoNome.localeCompare(b.cursoNome)
  }
  
  // 2. Por disciplina
  if (a.disciplinaNome !== b.disciplinaNome) {
    return a.disciplinaNome.localeCompare(b.disciplinaNome)
  }
  
  // 3. Por frente
  if (a.frenteNome !== b.frenteNome) {
    return a.frenteNome.localeCompare(b.frenteNome)
  }
  
  // 4. Por número do módulo (ordem didática)
  const numA = a.moduloNumero ?? 0
  const numB = b.moduloNumero ?? 0
  if (numA !== numB) {
    return numA - numB
  }
  
  // 5. Por ordem de exibição da atividade
  return (a.ordemExibicao ?? 0) - (b.ordemExibicao ?? 0)
})
```

**Passo 10: Agrupar em Estrutura Hierárquica**

```typescript
const estrutura: CursoComDisciplinas[] = []
const cursosMap = new Map()
const disciplinasMap = new Map()
const frentesMap = new Map()
const modulosMap = new Map()

atividadesComProgresso.forEach((atividade) => {
  // Criar/obter curso
  if (!cursosMap.has(atividade.cursoId)) {
    const curso = { id: atividade.cursoId, nome: atividade.cursoNome, disciplinas: [] }
    cursosMap.set(atividade.cursoId, curso)
    estrutura.push(curso)
  }
  
  // Criar/obter disciplina dentro do curso
  // Criar/obter frente dentro da disciplina
  // Criar/obter módulo dentro da frente
  // Adicionar atividade ao módulo
})
```

---

### 4. Contabilização de Progresso

#### 4.1. Cálculo de Estatísticas

**Componente**: `ProgressoStatsCard`

**Lógica**:
```typescript
const stats = {
  total: atividades.length,
  pendentes: atividades.filter((a) => !a.progressoStatus || a.progressoStatus === 'Pendente').length,
  iniciadas: atividades.filter((a) => a.progressoStatus === 'Iniciado').length,
  concluidas: atividades.filter((a) => a.progressoStatus === 'Concluido').length,
  percentual: total > 0 ? Math.round((concluidas / total) * 100) : 0
}
```

**Com Filtros Ativos**:
```typescript
// Se há filtros, mostra contagem filtrada + total geral
{hasFilters && totalGeral !== stats.total && (
  <span>de {totalGeral} totais</span>
)}
```

#### 4.2. Contadores por Módulo

**Componente**: `ModuloActivitiesAccordion`

**Lógica**:
```typescript
const atividadesConcluidas = modulo.atividades.filter(
  (a) => a.progressoStatus === 'Concluido'
).length

const totalAtividades = modulo.atividades.length
const percentual = total > 0 
  ? Math.round((atividadesConcluidas / totalAtividades) * 100) 
  : 0

// Exibe: "3/10 atividades concluídas (30%)"
```

---

### 5. Atualização de Progresso

#### 5.1. Fluxo de Atualização

**Quando aluno clica no checkbox ou botão "Iniciar"**:

**Componente**: `AtividadeChecklistRow`

**Passo 1: Determinar Novo Status**
```typescript
// Se checkbox marcado → 'Concluido'
// Se desmarcado → 'Pendente'
// Se botão "Iniciar" → 'Iniciado'

const newStatus: StatusAtividade = 'Concluido' | 'Iniciado' | 'Pendente'
```

**Passo 2: Preparar Dados de Atualização**
```typescript
const updateData = {
  status: newStatus,
  data_inicio: status === 'Iniciado' ? new Date().toISOString() : undefined,
  data_conclusao: status === 'Concluido' ? new Date().toISOString() : undefined,
}
```

**Passo 3: Buscar ou Criar Progresso**
```typescript
// Verificar se já existe progresso
const { data: progressoExistente } = await supabase
  .from('progresso_atividades')
  .select('id')
  .eq('aluno_id', alunoId)
  .eq('atividade_id', atividadeId)
  .maybeSingle()
```

**Passo 4: Atualizar ou Criar**
```typescript
if (progressoExistente) {
  // Atualizar progresso existente
  await supabase
    .from('progresso_atividades')
    .update(updateData)
    .eq('id', progressoExistente.id)
} else {
  // Criar novo progresso
  await supabase
    .from('progresso_atividades')
    .insert({
      aluno_id: alunoId,
      atividade_id: atividadeId,
      ...updateData,
    })
}
```

**Passo 5: Atualização Otimística (UI)**
```typescript
// Atualizar estado local imediatamente (sem esperar resposta)
setAtividades((prev) =>
  prev.map((a) => {
    if (a.id === atividadeId) {
      return {
        ...a,
        progressoStatus: newStatus,
        progressoDataInicio: updateData.data_inicio || a.progressoDataInicio,
        progressoDataConclusao: updateData.data_conclusao || a.progressoDataConclusao,
      }
    }
    return a
  })
)
```

**Vantagens da Atualização Otimística**:
- UI responde instantaneamente
- Melhor experiência do usuário
- Se falhar, pode fazer rollback

---

### 6. Filtros e Busca

#### 6.1. Sistema de Filtros em Cascata

**Componente**: `SalaEstudosFilters`

**Lógica**:
```typescript
// Filtro 1: Curso
cursoSelecionado → Filtra disciplinas daquele curso

// Filtro 2: Disciplina (dependente do curso)
disciplinaSelecionada → Filtra frentes daquela disciplina

// Filtro 3: Frente (dependente da disciplina)
frenteSelecionada → Filtra atividades daquela frente
```

**Carregamento de Disciplinas**:
```typescript
// Quando curso é selecionado
const { data: cursosDisciplinas } = await supabase
  .from('cursos_disciplinas')
  .select('disciplina_id')
  .eq('curso_id', cursoSelecionado)

// Buscar disciplinas
const disciplinaIds = cursosDisciplinas.map((cd) => cd.disciplina_id)
const { data: disciplinas } = await supabase
  .from('disciplinas')
  .select('id, nome')
  .in('id', disciplinaIds)
```

**Carregamento de Frentes**:
```typescript
// Quando disciplina é selecionada
const { data: frentes } = await supabase
  .from('frentes')
  .select('id, nome, disciplina_id')
  .eq('disciplina_id', disciplinaSelecionada)
```

#### 6.2. Aplicação de Filtros nas Atividades

**Lógica de Filtragem**:
```typescript
const atividadesFiltradas = atividades.filter((a) => {
  // Filtrar por curso
  if (cursoSelecionado && a.cursoId !== cursoSelecionado) return false
  
  // Filtrar por disciplina
  if (disciplinaSelecionada && a.disciplinaId !== disciplinaSelecionada) return false
  
  // Filtrar por frente
  if (frenteSelecionada && a.frenteId !== frenteSelecionada) return false
  
  return true
})
```

**Reagrupamento Após Filtro**:
```typescript
// Reagrupar estrutura hierárquica apenas com atividades filtradas
const estruturaFiltrada = reagruparAtividades(atividadesFiltradas)
```

---

### 7. Tratamento de Estados

#### 7.1. Estados de Loading

**Estados**:
- `isLoading`: Carregamento inicial (cursos)
- `isLoadingAtividades`: Carregamento de atividades
- `isUpdating`: Atualização de progresso individual

**Exibição**:
```typescript
{isLoading ? (
  <Skeleton className="h-96 w-full" />
) : (
  // Conteúdo
)}
```

#### 7.2. Estados Vazios

**Sem Matrículas (Aluno)**:
```typescript
if (!matriculas || matriculas.length === 0) {
  // Mostrar mensagem: "Você não possui matrículas ativas"
}
```

**Sem Atividades**:
```typescript
if (atividades.length === 0) {
  // Mostrar: "Nenhuma atividade encontrada"
}
```

**Sem Resultados com Filtros**:
```typescript
if (atividadesFiltradas.length === 0 && hasFilters) {
  // Mostrar: "Nenhuma atividade encontrada com os filtros selecionados"
}
```

#### 7.3. Tratamento de Erros

**Erros Comuns**:
- Erro de autenticação
- Erro de permissão (RLS)
- Erro de rede
- Erro de validação

**Exibição**:
```typescript
{error && (
  <Card className="border-destructive">
    <CardHeader>
      <AlertCircle className="h-5 w-5 text-destructive" />
      <CardTitle>Erro</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-destructive">{error}</p>
    </CardContent>
  </Card>
)}
```

---

### 8. Validações Críticas

#### 8.1. Matrícula Ativa

**Onde**: Todas as queries de atividades do aluno

**Código**:
```typescript
.eq('ativo', true)  // ⚠️ CRÍTICO
```

**Por quê?**
- Alunos podem cancelar ou trancar cursos
- Não devemos mostrar atividades de cursos inativos
- Garante que apenas cursos ativos aparecem

#### 8.2. Período de Acesso (Opcional)

**Implementação Futura**:
```typescript
.and(`data_inicio_acesso.lte.${today},data_fim_acesso.gte.${today}`)
```

**Por quê?**
- Alguns cursos têm período limitado de acesso
- Validação adicional de segurança

#### 8.3. Ordenação Didática

**Backend (SQL)**:
```sql
ORDER BY 
  c.nome ASC,
  d.nome ASC,
  f.nome ASC,
  COALESCE(m.numero_modulo, 0) ASC,      -- Ordem didática dos módulos
  COALESCE(a.ordem_exibicao, 0) ASC      -- Ordem didática das atividades
```

**Frontend**:
- Não reordena os dados recebidos
- Mantém ordem exata do backend
- Garante sequência didática correta

---

### 9. Performance e Otimizações

#### 9.1. Estratégias de Performance

**1. Múltiplas Queries Pequenas vs Uma Query Gigante**
- ✅ Mais fácil de depurar
- ✅ Melhor uso de índices
- ✅ Menos problemas de RLS
- ⚠️ Mais round-trips (mas compensa)

**2. Uso de Maps para Lookup**
```typescript
// Criar mapas para lookup O(1)
const modulosMap = new Map(modulosData.map((m) => [m.id, m]))
const frentesMap = new Map(frentesData.map((f) => [f.id, f]))
const progressosMap = new Map(progressosData.map((p) => [p.atividade_id, p]))
```

**3. Memoização com useMemo**
```typescript
const atividadesFiltradas = React.useMemo(
  () => atividades.filter(/* filtros */),
  [atividades, cursoSelecionado, disciplinaSelecionada, frenteSelecionada]
)
```

**4. Atualização Otimística**
- UI atualiza imediatamente
- Não espera resposta do servidor
- Melhor UX

#### 9.2. Índices no Banco (Já Criados)

```sql
CREATE INDEX idx_atividades_modulo ON atividades(modulo_id);
CREATE INDEX idx_progresso_aluno_atividade ON progresso_atividades(aluno_id, atividade_id);
```

---

### 10. Segurança (RLS)

#### 10.1. Políticas RLS

**Tabela `atividades`**:
- ✅ Todos podem **ler** (SELECT)
- ✅ Apenas professores podem **criar/editar** (INSERT/UPDATE)

**Tabela `progresso_atividades`**:
- ✅ Aluno vê apenas **seu próprio progresso** (SELECT)
- ✅ Aluno pode **criar/editar apenas seu próprio progresso** (INSERT/UPDATE)

**Storage `materiais_didaticos`**:
- ✅ Professores podem fazer **upload** (INSERT)
- ✅ Todos podem **ler** (SELECT - bucket público)
- ✅ Professores podem **atualizar/deletar** (UPDATE/DELETE)

#### 10.2. Função RPC para Evitar Problemas

**Problema**: Políticas RLS que verificam superadmin tentam acessar `auth.users` diretamente, causando erro.

**Solução**: Função RPC com `SECURITY DEFINER`

```sql
CREATE FUNCTION get_matriculas_aluno(p_aluno_id UUID)
RETURNS TABLE (curso_id UUID) 
SECURITY DEFINER  -- Executa com privilégios elevados
SET search_path = public
```

---

## 📈 Fluxo Visual Completo

### Exemplo: Aluno Visualiza Atividades

```
1. Aluno acessa /aluno/sala-de-estudos
   ↓
2. Sistema detecta: role = 'aluno'
   ↓
3. Busca matrículas ativas (RPC)
   ├─ Aluno tem 2 cursos: "Medicina 2024", "Residência"
   ↓
4. Busca atividades dos 2 cursos
   ├─ Medicina 2024
   │  ├─ Disciplina: Anatomia
   │  │  ├─ Frente: Sistema Muscular
   │  │  │  ├─ Módulo 1: Introdução
   │  │  │  │  ├─ Atividade 1: Conceituário (✅ Concluído)
   │  │  │  │  ├─ Atividade 2: Lista N1 (⏸️ Iniciado)
   │  │  │  │  └─ Atividade 3: Lista N2 (⭕ Pendente)
   │  │  │  └─ Módulo 2: ...
   │  │  └─ Frente: Sistema Nervoso
   │  └─ Disciplina: Fisiologia
   └─ Residência
      └─ ...
   ↓
5. Agrupa em estrutura hierárquica
   ↓
6. Calcula estatísticas
   ├─ Total: 45 atividades
   ├─ Pendentes: 30
   ├─ Iniciadas: 10
   └─ Concluídas: 5 (11%)
   ↓
7. Renderiza na tela
   ├─ Card de Estatísticas
   ├─ Filtros (Curso > Disciplina > Frente)
   └─ Accordions por módulo
```

### Exemplo: Aluno Marca Atividade como Concluída

```
1. Aluno clica no checkbox da atividade
   ↓
2. Determina novo status: 'Concluido'
   ↓
3. Preparar dados:
   {
     status: 'Concluido',
     data_conclusao: '2025-01-31T10:30:00Z',
     data_inicio: '2025-01-30T09:00:00Z' (se já iniciado)
   }
   ↓
4. Buscar progresso existente
   ├─ Existe? → Atualizar
   └─ Não existe? → Criar novo
   ↓
5. Atualizar banco de dados
   ↓
6. Atualizar UI otimisticamente
   ├─ Marcar checkbox como checked
   ├─ Atualizar badge para "Concluído"
   ├─ Mostrar data de conclusão
   └─ Atualizar estatísticas (5 → 6 concluídas)
   ↓
7. Recalcular percentuais
   ├─ ProgressoStatsCard: 11% → 13%
   └─ ModuloAccordion: 2/5 → 3/5 (60%)
```

---

## 🔍 Detalhes Técnicos

### 10.1. Query Complexa: Por Que Múltiplas Queries?

**Abordagem Escolhida**: Múltiplas queries simples

**Vantagens**:
- ✅ Mais fácil de depurar
- ✅ Melhor controle de erros
- ✅ Evita problemas de RLS complexos
- ✅ Mais flexível (professores vs alunos)
- ✅ Melhor uso de índices individuais

**Desvantagens**:
- ⚠️ Mais round-trips ao banco
- ⚠️ Mais código TypeScript

**Alternativa Rejeitada**: Uma query gigante com múltiplos JOINs
- ❌ Muito complexa
- ❌ Difícil de depurar
- ❌ Problemas com RLS

### 10.2. Ordenação: Por Que no Backend?

**Decisão**: Ordenar no backend (SQL)

**Por quê?**
- ✅ Garante ordem consistente
- ✅ Usa índices do banco
- ✅ Mais eficiente para grandes volumes
- ✅ Evita problemas de ordenação no frontend

**Frontend**: Apenas mantém a ordem recebida

### 10.3. Progresso: Por Que Criar Se Não Existe?

**Lógica**: `findOrCreateProgresso`

**Por quê?**
- ✅ Não precisamos criar progresso antecipadamente
- ✅ Criamos apenas quando aluno interage
- ✅ Menos dados no banco (apenas progressos reais)
- ✅ Mais flexível

**Quando cria?**
- Aluno marca como "Iniciado"
- Aluno marca como "Concluído"
- Nunca cria automaticamente em "Pendente"

---

## 📊 Estrutura de Dados Final

### Tipo `AtividadeComProgresso`

```typescript
interface AtividadeComProgresso {
  // Dados da atividade
  id: string
  titulo: string
  tipo: TipoAtividade
  arquivoUrl: string | null
  ordemExibicao: number
  
  // Hierarquia
  cursoId: string
  cursoNome: string
  disciplinaId: string
  disciplinaNome: string
  frenteId: string
  frenteNome: string
  moduloId: string
  moduloNome: string
  moduloNumero: number | null
  
  // Progresso
  progressoStatus: 'Pendente' | 'Iniciado' | 'Concluido' | null
  progressoDataInicio: string | null
  progressoDataConclusao: string | null
}
```

### Estrutura Hierárquica

```typescript
CursoComDisciplinas
  └── DisciplinaComFrentes
      └── FrenteComModulos
          └── ModuloComAtividades
              └── AtividadeComProgresso[]
```

---

## 🎯 Resumo Executivo

### Como Funciona

1. **Detecta Role**: Aluno ou Professor
2. **Busca Cursos**: Via matrículas (aluno) ou todos (professor)
3. **Busca Atividades**: Query complexa em múltiplas etapas
4. **Busca Progresso**: Para cada atividade do aluno
5. **Agrupa Hierarquicamente**: Curso → Disciplina → Frente → Módulo → Atividade
6. **Ordena**: Por ordem didática rigorosa
7. **Renderiza**: Com filtros, estatísticas e checklist

### Contabilização de Progresso

1. **Filtra** atividades por status
2. **Conta** total, pendentes, iniciadas, concluídas
3. **Calcula** percentual: `(concluídas / total) * 100`
4. **Atualiza** em tempo real quando aluno marca progresso
5. **Mostra** contadores contextuais (filtrados vs total)

---

## 📝 Próximos Passos (Opcionais)

1. **Validação de Período de Acesso**: Filtrar por `data_inicio_acesso` e `data_fim_acesso`
2. **Cache**: Cachear queries para melhor performance
3. **Funcionalidades Extras**: Anotações pessoais, dificuldade percebida
4. **Otimizações**: Lazy loading, virtualização de listas

---

**Documento Criado**: 2025-01-31  
**Versão**: 1.0



