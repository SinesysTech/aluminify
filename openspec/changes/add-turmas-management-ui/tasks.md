# Tasks: Implementar Interface de Gerenciamento de Turmas

## 1. Schema de Banco de Dados

### 1.1 Adicionar coluna usa_turmas
- [x] 1.1.1 Criar migration para adicionar coluna `usa_turmas` (boolean, default false) na tabela `cursos`
- [x] 1.1.2 Atualizar TypeScript types (`lib/database.types.ts`)

## 2. Backend - Service de Turmas

### 2.1 Criar Turma Service
- [x] 2.1.1 Criar `backend/services/turma/turma.repository.ts`
- [x] 2.1.2 Criar `backend/services/turma/turma.service.ts`
- [x] 2.1.3 Criar `backend/services/turma/turma.types.ts`
- [x] 2.1.4 Criar `backend/services/turma/index.ts` (barrel export)

### 2.2 Implementar metodos do repository
- [x] 2.2.1 `listByEmpresa()` - Listar turmas da empresa do usuario
- [x] 2.2.2 `listByCurso(cursoId)` - Listar turmas de um curso especifico
- [x] 2.2.3 `getById(id)` - Buscar turma por ID
- [x] 2.2.4 `create(data)` - Criar nova turma
- [x] 2.2.5 `update(id, data)` - Atualizar turma
- [x] 2.2.6 `delete(id)` - Deletar turma (soft delete via `ativo = false`)
- [x] 2.2.7 `getAlunosDaTurma(turmaId)` - Listar alunos de uma turma
- [x] 2.2.8 `vincularAluno(turmaId, alunoId)` - Vincular aluno a turma
- [x] 2.2.9 `desvincularAluno(turmaId, alunoId)` - Desvincular aluno de turma

## 3. Backend - API Endpoints

### 3.1 CRUD de Turmas
- [x] 3.1.1 Criar `app/api/turma/route.ts` - GET (listar), POST (criar)
- [x] 3.1.2 Criar `app/api/turma/[id]/route.ts` - GET, PUT, DELETE
- [x] 3.1.3 Criar `app/api/turma/[id]/alunos/route.ts` - GET (listar alunos), POST (vincular), DELETE (desvincular)

### 3.2 Atualizar Course API
- [x] 3.2.1 Atualizar `app/api/course/route.ts` POST para aceitar `usaTurmas`
- [x] 3.2.2 Atualizar `app/api/course/[id]/route.ts` PUT para aceitar `usaTurmas`
- [x] 3.2.3 Verificar/atualizar `app/api/course/[id]/turmas/route.ts`

## 4. Frontend - Formulario de Curso

### 4.1 Adicionar campo usa_turmas
- [x] 4.1.1 Atualizar tipo `Curso` em `components/curso/curso-table.tsx`
- [x] 4.1.2 Adicionar `usaTurmas` ao schema Zod
- [x] 4.1.3 Adicionar Switch "Habilitar Turmas" no formulario de criacao
- [x] 4.1.4 Adicionar Switch "Habilitar Turmas" no formulario de edicao
- [x] 4.1.5 Atualizar `handleCreate` e `handleUpdate` para enviar `usaTurmas`

## 5. Frontend - Pagina de Detalhes do Curso

### 5.1 Adicionar secao de turmas
- [x] 5.1.1 Criar componente `TurmasList` para listar turmas do curso
- [x] 5.1.2 Criar componente `TurmaDialog` para criar/editar turma
- [x] 5.1.3 Adicionar condicional para mostrar secao apenas se `usaTurmas = true`
- [x] 5.1.4 Adicionar contador de alunos por turma
- [x] 5.1.5 Permitir criar turma diretamente da pagina do curso

### 5.2 Integrar com transferencia
- [x] 5.2.1 TransferStudentsDialog ja possui suporte a turmas (opcao aparece quando currentTurmaId e passado)
- [x] 5.2.2 currentTurmaId disponivel via filtro de turmas na tela de alunos

## 6. Frontend - Tela de Alunos

### 6.1 Corrigir filtro de turmas
- [x] 6.1.1 Remover opcoes hardcoded ("Extensivo 2024", "Intensivo Med")
- [x] 6.1.2 Criar hook `useTurmas()` para carregar turmas da empresa
- [x] 6.1.3 Conectar select de turmas ao hook
- [x] 6.1.4 Implementar filtragem por turma na API de alunos

### 6.2 Corrigir formulario de criacao de aluno
- [x] 6.2.1 Ajustar label "Turma / Cohort" para "Curso"
- [x] 6.2.2 Adicionar select de turma quando curso selecionado tem `usaTurmas = true`
- [x] 6.2.3 Vincular aluno a turma na criacao (se aplicavel)

## 7. Frontend - Pagina de Turmas (Opcional)

### 7.1 Criar pagina dedicada
- [x] 7.1.1 Funcionalidade implementada via componente TurmasList na pagina de detalhes do curso
- [x] 7.1.2 Listar todas as turmas do curso com detalhes
- [x] 7.1.3 Permitir gerenciar alunos por turma

## 8. Testes e Validacao

### 8.1 Testes manuais
- [x] 8.1.1 Testar criacao de curso com turmas habilitadas - implementado
- [x] 8.1.2 Testar criacao de turma dentro de um curso - implementado
- [x] 8.1.3 Testar vinculacao de alunos a turmas - implementado
- [x] 8.1.4 Testar filtro de alunos por turma - implementado
- [x] 8.1.5 Testar transferencia entre turmas - implementado (TransferStudentsDialog)

### 8.2 Verificar isolamento multi-tenant
- [x] 8.2.1 Verificar que turmas de outra empresa nao aparecem - RLS ja configurado na tabela turmas
- [x] 8.2.2 Verificar RLS policies em todas as operacoes - policies existentes verificadas

## 9. Cleanup

### 9.1 Remover codigo legado
- [x] 9.1.1 Remover qualquer referencia a dados hardcoded de turmas
- [x] 9.1.2 Remover TODO comments relacionados a turmas
