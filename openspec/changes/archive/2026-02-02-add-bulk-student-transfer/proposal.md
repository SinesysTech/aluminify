# Change: Implementar Transferencia em Massa de Alunos

## Why

Administradores precisam transferir multiplos alunos entre cursos ou turmas de forma eficiente.
Atualmente, transferencias sao feitas individualmente, o que e inviavel para operacoes com dezenas
ou centenas de alunos. Esta funcionalidade permite:

1. **Selecao em massa** - Selecionar 10, 20, 30 ou todos os alunos de uma lista
2. **Transferencia entre cursos** - Mover alunos de um curso para outro
3. **Transferencia entre turmas** - Mover alunos de uma turma para outra dentro do mesmo curso

## What Changes

### Novos Endpoints de API
- `POST /api/student/bulk-transfer/course` - Transferir alunos entre cursos
- `POST /api/student/bulk-transfer/turma` - Transferir alunos entre turmas
- `GET /api/student/by-course/[courseId]` - Listar alunos por curso
- `GET /api/student/by-turma/[turmaId]` - Listar alunos por turma
- `GET /api/course/[courseId]/turmas` - Listar turmas de um curso

### Novos Componentes de UI
- Selecao em massa na tabela de alunos (checkboxes)
- Barra de acoes em massa (bottom bar com contagem)
- Dialog de transferencia com selecao de destino
- Dropdown de selecao rapida (10, 20, 30, todos)

### Nova Camada de Servico
- `StudentTransferService` - Logica de negocio para transferencias
- `StudentTransferRepository` - Operacoes de banco para transferencias

## Impact

- Affected specs: student-management
- Affected code:
  - `components/aluno/aluno-table.tsx` - Adicionar selecao
  - `backend/services/student/` - Novos arquivos de servico/repositorio
  - `app/api/student/` - Novos endpoints
- **BREAKING**: Nenhuma mudanca breaking - todas as alteracoes sao aditivas
