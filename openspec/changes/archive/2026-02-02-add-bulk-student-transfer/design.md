# Design: Transferencia em Massa de Alunos

## Decisoes Tecnicas

### 1. Processamento em Batch
- Transferencias serao processadas em lotes de 10 alunos
- Segue o padrao existente em `student-import.service.ts`
- Permite feedback de progresso e evita timeouts

### 2. Isolamento Multi-tenant
- RLS existente ja garante isolamento via `empresa_id`
- Todas as queries usam o cliente Supabase autenticado (nao admin)
- Nenhuma policy adicional necessaria

### 3. Schema do Banco
- **Sem alteracoes de schema** - usar tabelas existentes:
  - `alunos_cursos` para link aluno-curso
  - `alunos_turmas` para link aluno-turma (ja implementado)
  - `matriculas` para dados de matricula (opcional)

### 4. Status de Transferencia de Turma
- Ao transferir de turma, o registro antigo recebe status configuravel:
  - `concluido` (padrao) - aluno concluiu periodo na turma
  - `cancelado` - transferencia por cancelamento
  - `trancado` - transferencia por trancamento

## Fluxo de Transferencia

```
Usuario seleciona alunos na tabela
         |
         v
Clica em "Transferir" na barra de acoes
         |
         v
Dialog abre com opcoes:
- Tipo: Curso ou Turma
- Destino: Lista de cursos/turmas disponiveis
         |
         v
Usuario confirma transferencia
         |
         v
API processa em batches de 10
         |
         v
Retorna resultado detalhado:
- Total processados
- Sucessos
- Falhas com motivo
- Pulados (ja no destino)
```

## Estrutura de Arquivos

### Backend

```
backend/services/student/
├── student-transfer.types.ts      # Tipos e interfaces
├── student-transfer.repository.ts # Operacoes de banco
├── student-transfer.service.ts    # Logica de negocio
└── index.ts                       # Re-exports
```

### API Routes

```
app/api/student/
├── bulk-transfer/
│   ├── course/
│   │   └── route.ts    # POST - transferir entre cursos
│   └── turma/
│       └── route.ts    # POST - transferir entre turmas
├── by-course/
│   └── [courseId]/
│       └── route.ts    # GET - listar alunos do curso
└── by-turma/
    └── [turmaId]/
        └── route.ts    # GET - listar alunos da turma

app/api/course/
└── [courseId]/
    └── turmas/
        └── route.ts    # GET - listar turmas do curso
```

### UI Components

```
components/aluno/
├── aluno-table.tsx              # Modificar: adicionar selecao
├── bulk-actions-bar.tsx         # Novo: barra de acoes em massa
└── transfer-students-dialog.tsx # Novo: dialog de transferencia
```

## Schemas de API

### POST /api/student/bulk-transfer/course

**Request:**
```typescript
{
  studentIds: string[];           // UUIDs dos alunos (max 100)
  sourceCourseId: string;         // Curso de origem
  targetCourseId: string;         // Curso de destino
  options?: {
    preserveEnrollmentDates?: boolean;  // Manter datas originais
    updateMatriculas?: boolean;         // Atualizar tabela matriculas
  }
}
```

**Response:**
```typescript
{
  total: number;
  success: number;
  failed: number;
  results: {
    studentId: string;
    studentName: string;
    status: 'success' | 'failed' | 'skipped';
    message?: string;
  }[]
}
```

### POST /api/student/bulk-transfer/turma

**Request:**
```typescript
{
  studentIds: string[];           // UUIDs dos alunos (max 100)
  sourceTurmaId: string;          // Turma de origem
  targetTurmaId: string;          // Turma de destino (mesmo curso)
  sourceStatusOnTransfer?: 'concluido' | 'cancelado' | 'trancado';
}
```

**Response:** Mesmo schema do endpoint de curso

## Tratamento de Erros

| Cenario | HTTP Status | Mensagem |
|---------|-------------|----------|
| Nenhum aluno selecionado | 400 | "Selecione pelo menos um aluno" |
| Origem e destino iguais | 400 | "Origem e destino devem ser diferentes" |
| Aluno nao esta na origem | 400 | "Aluno {nome} nao esta matriculado no curso/turma de origem" |
| Curso/turma nao encontrado | 404 | "Curso/Turma de destino nao encontrado" |
| Turmas de cursos diferentes | 400 | "As turmas devem pertencer ao mesmo curso" |
| Limite excedido | 400 | "Maximo de 100 alunos por transferencia" |
| Falha parcial | 207 | Multi-status com resultados individuais |

## Consideracoes de Performance

1. **Limite de 100 alunos por request** - evita sobrecarga
2. **Batches de 10** - permite feedback e evita locks longos
3. **Transacoes por batch** - rollback granular em caso de falha
4. **Indices existentes** - `alunos_cursos` e `alunos_turmas` ja tem PKs compostas

## Alternativas Consideradas

### 1. Transferencia sincrona vs assincrona
**Escolhido:** Sincrono com batches
**Motivo:** Simplicidade e feedback imediato. Para volumes maiores (1000+), considerar jobs assincronos no futuro.

### 2. Soft delete vs update de registros
**Escolhido:** Update de status para turmas, delete+insert para cursos
**Motivo:** Manter historico de turmas (status tracking), mas `alunos_cursos` nao tem campo de status.

### 3. Modal vs pagina dedicada
**Escolhido:** Dialog/Modal
**Motivo:** Fluxo mais rapido, nao precisa navegar para outra pagina.
