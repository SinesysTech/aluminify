# Tasks: Transferencia em Massa de Alunos

## 1. Backend - Tipos e Interfaces
- [x] 1.1 Criar `student-transfer.types.ts` com interfaces de request/response

## 2. Backend - Repository
- [x] 2.1 Criar `student-transfer.repository.ts`
- [x] 2.2 Implementar `transferStudentsBetweenCourses()`
- [x] 2.3 Implementar `transferStudentsBetweenTurmas()`
- [x] 2.4 Implementar `getStudentsByCourse()`
- [x] 2.5 Implementar `getStudentsByTurma()`
- [x] 2.6 Implementar `getTurmasByCourse()`
- [x] 2.7 Implementar `validateTurmasSameCourse()`

## 3. Backend - Service
- [x] 3.1 Criar `student-transfer.service.ts`
- [x] 3.2 Implementar `bulkTransferBetweenCourses()` com validacoes
- [x] 3.3 Implementar `bulkTransferBetweenTurmas()` com validacoes
- [x] 3.4 Implementar processamento em batch (grupos de 10)
- [x] 3.5 Implementar tratamento de erros e resultados parciais

## 4. API Routes
- [x] 4.1 Criar `POST /api/student/bulk-transfer/course/route.ts`
- [x] 4.2 Criar `POST /api/student/bulk-transfer/turma/route.ts`
- [x] 4.3 Criar `GET /api/student/by-course/[courseId]/route.ts`
- [x] 4.4 Criar `GET /api/student/by-turma/[turmaId]/route.ts`
- [x] 4.5 Criar `GET /api/course/[courseId]/turmas/route.ts`

## 5. UI - Componentes
- [x] 5.1 Modificar `aluno-table.tsx` para adicionar selecao de linhas
- [x] 5.2 Criar componente `bulk-actions-bar.tsx`
- [x] 5.3 Criar componente `transfer-students-dialog.tsx`
- [x] 5.4 Adicionar dropdown de selecao rapida (10, 20, 30, todos)
- [x] 5.5 Integrar estado de selecao (usando useState local)

## 6. Integracao e Testes
- [x] 6.1 Integrar componentes na pagina de alunos
- [ ] 6.2 Testar transferencia entre cursos
- [ ] 6.3 Testar transferencia entre turmas
- [ ] 6.4 Testar cenarios de erro (aluno ja no destino, turmas de cursos diferentes)
- [ ] 6.5 Testar com volume grande (50+ alunos)

---

## Arquivos Criados

### Backend
- `backend/services/student/student-transfer.types.ts`
- `backend/services/student/student-transfer.repository.ts`
- `backend/services/student/student-transfer.service.ts`

### API Routes
- `app/api/student/bulk-transfer/course/route.ts`
- `app/api/student/bulk-transfer/turma/route.ts`
- `app/api/student/by-course/[courseId]/route.ts`
- `app/api/student/by-turma/[turmaId]/route.ts`
- `app/api/course/[courseId]/turmas/route.ts`

### UI Components
- `components/aluno/bulk-actions-bar.tsx`
- `components/aluno/transfer-students-dialog.tsx`

### Modificados
- `backend/services/student/index.ts` - Adicionada factory function
- `components/aluno/aluno-table.tsx` - Adicionada selecao de linhas
