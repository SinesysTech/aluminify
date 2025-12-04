# 🔧 Correção: Alinhamento Sala de Estudos com Cronograma

## 📋 Problema Identificado

O aluno com email "brenomeira@brenomeira.com.br" está cadastrado no curso "CDF (Curso de Física)", mas:
- ✅ O curso **aparece** na geração de cronograma
- ❌ O curso **NÃO aparece** na Sala de Estudos

### Causa Raiz

Os dois sistemas usavam **fontes de dados diferentes**:
- **Cronograma**: Usa a tabela `alunos_cursos`
- **Sala de Estudos**: Usava a tabela `matriculas` (via RPC `get_matriculas_aluno`)

O aluno está cadastrado em `alunos_cursos`, mas não em `matriculas`, causando a inconsistência.

---

## ✅ Solução Aplicada

Alinhamos a Sala de Estudos para usar **a mesma lógica do cronograma**: `alunos_cursos`.

### Mudanças Realizadas

#### 1. Frontend - Busca de Cursos (`sala-estudos-client.tsx`)

**Antes** (usava `matriculas`):
```typescript
// Se for aluno, buscar matrículas ativas usando função RPC
const { data: matriculas, error: matError } = await supabase
  .rpc('get_matriculas_aluno', { p_aluno_id: alunoId })
// ...
cursoIds = matriculas.map((m: { curso_id: string }) => m.curso_id)
```

**Depois** (usa `alunos_cursos`, igual ao cronograma):
```typescript
// Se for aluno, buscar cursos através da tabela alunos_cursos (mesmo método do cronograma)
const { data: alunosCursos, error: alunosCursosError } = await supabase
  .from('alunos_cursos')
  .select('curso_id, cursos(*)')
  .eq('aluno_id', alunoId)
// ...
const cursosData = alunosCursos.map((ac: any) => ac.cursos).filter(Boolean)
cursoIds = cursosData.map((c: any) => c.id)
```

#### 2. Frontend - Busca de Atividades (`sala-estudos-client.tsx`)

Mesma mudança aplicada na função `fetchAtividades`.

#### 3. Backend - Helper de Atividades (`atividade.repository-helper.ts`)

**Antes**:
```typescript
// 1. Buscar matrículas ativas do aluno
const { data: matriculas, error: matError } = await client
  .from('matriculas')
  .select('curso_id')
  .eq('aluno_id', alunoId)
  .eq('ativo', true);
// ...
const cursoIds = matriculas.map((m) => m.curso_id);
```

**Depois**:
```typescript
// 1. Buscar cursos do aluno através da tabela alunos_cursos (mesmo método do cronograma)
const { data: alunosCursos, error: alunosCursosError } = await client
  .from('alunos_cursos')
  .select('curso_id')
  .eq('aluno_id', alunoId);
// ...
const cursoIds = alunosCursos.map((ac: any) => ac.curso_id);
```

---

## 📊 Comparação das Tabelas

### `alunos_cursos`
- Tabela simples de relacionamento aluno-curso
- Usada pelo cronograma
- Estrutura: `aluno_id`, `curso_id`, `created_at`

### `matriculas`
- Tabela mais complexa com datas de acesso e status
- Estrutura: `aluno_id`, `curso_id`, `data_matricula`, `data_inicio_acesso`, `data_fim_acesso`, `ativo`
- Não estava sendo populada para todos os alunos

---

## ✅ Resultado

Agora ambos os sistemas usam **a mesma fonte de dados** (`alunos_cursos`), garantindo consistência:

- ✅ Cronograma: Busca cursos via `alunos_cursos`
- ✅ Sala de Estudos: Busca cursos via `alunos_cursos`
- ✅ Backend (API): Busca cursos via `alunos_cursos`

---

## 🧪 Validação

### Teste SQL

Verificamos que o aluno está em `alunos_cursos`:
```sql
SELECT 
  ac.aluno_id,
  ac.curso_id,
  c.nome as curso_nome,
  u.email
FROM public.alunos_cursos ac
JOIN public.cursos c ON c.id = ac.curso_id
JOIN auth.users u ON u.id = ac.aluno_id
WHERE u.email = 'brenomeira@brenomeira.com.br';
```

Resultado: ✅ Encontrado curso "CDF (Curso de Física)"

### Verificações Necessárias

1. ✅ Frontend atualizado para usar `alunos_cursos`
2. ✅ Backend atualizado para usar `alunos_cursos`
3. ✅ Sem erros de lint
4. ⏳ Testar no navegador que o curso aparece na Sala de Estudos

---

## 📝 Observações

- A função RPC `get_matriculas_aluno` pode ser mantida para outros usos, mas não é mais usada pela Sala de Estudos
- O nome do método `listByAlunoMatriculas` pode ser mantido para não quebrar a API, mas agora busca de `alunos_cursos`
- Se no futuro precisarmos usar `matriculas` com datas de acesso, podemos criar uma função que unifique ambas as tabelas

---

**Data**: 2025-02-01  
**Status**: ✅ **CORREÇÃO APLICADA - Aguardando teste**



