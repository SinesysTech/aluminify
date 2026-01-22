# Tasks: Transferencia em Massa de Alunos

## 1. Backend - Tipos e Interfaces
- [ ] 1.1 Criar `student-transfer.types.ts` com interfaces de request/response

## 2. Backend - Repository
- [ ] 2.1 Criar `student-transfer.repository.ts`
- [ ] 2.2 Implementar `transferStudentsBetweenCourses()`
- [ ] 2.3 Implementar `transferStudentsBetweenTurmas()`
- [ ] 2.4 Implementar `getStudentsByCourse()`
- [ ] 2.5 Implementar `getStudentsByTurma()`
- [ ] 2.6 Implementar `getTurmasByCourse()`
- [ ] 2.7 Implementar `validateTurmasSameCourse()`

## 3. Backend - Service
- [ ] 3.1 Criar `student-transfer.service.ts`
- [ ] 3.2 Implementar `bulkTransferBetweenCourses()` com validacoes
- [ ] 3.3 Implementar `bulkTransferBetweenTurmas()` com validacoes
- [ ] 3.4 Implementar processamento em batch (grupos de 10)
- [ ] 3.5 Implementar tratamento de erros e resultados parciais

## 4. API Routes
- [ ] 4.1 Criar `POST /api/student/bulk-transfer/course/route.ts`
- [ ] 4.2 Criar `POST /api/student/bulk-transfer/turma/route.ts`
- [ ] 4.3 Criar `GET /api/student/by-course/[courseId]/route.ts`
- [ ] 4.4 Criar `GET /api/student/by-turma/[turmaId]/route.ts`
- [ ] 4.5 Criar `GET /api/course/[courseId]/turmas/route.ts`

## 5. UI - Componentes
- [ ] 5.1 Modificar `aluno-table.tsx` para adicionar selecao de linhas
- [ ] 5.2 Criar componente `bulk-actions-bar.tsx`
- [ ] 5.3 Criar componente `transfer-students-dialog.tsx`
- [ ] 5.4 Adicionar dropdown de selecao rapida (10, 20, 30, todos)
- [ ] 5.5 Integrar estado de selecao com React Query

## 6. Integracao e Testes
- [ ] 6.1 Integrar componentes na pagina de alunos por curso
- [ ] 6.2 Testar transferencia entre cursos
- [ ] 6.3 Testar transferencia entre turmas
- [ ] 6.4 Testar cenarios de erro (aluno ja no destino, turmas de cursos diferentes)
- [ ] 6.5 Testar com volume grande (50+ alunos)
