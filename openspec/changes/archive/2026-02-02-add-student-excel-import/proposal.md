# Change: Implementar Importação de Alunos via Excel com Download de Modelo

## Why

A página de alunos possui botões de "Importar CSV" e "Importar Planilha" que não estão funcionais. Embora já exista uma API de bulk-import (`/api/student/bulk-import`), a integração na página de administração de alunos não está completa. Usuários precisam de uma forma intuitiva de importar alunos em massa, incluindo um modelo de planilha Excel que indique claramente quais campos são obrigatórios e opcionais.

## What Changes

- Implementar dialog de importação de alunos na página de administração (`client-page.tsx`)
- Criar componente reutilizável de importação com:
  - Upload de arquivo (CSV/XLSX)
  - Botão para baixar modelo Excel
  - Feedback de progresso e resultados
- Gerar modelo Excel profissional com:
  - Headers claros indicando campos obrigatórios (*)
  - Planilha de instruções detalhadas
  - Exemplos de preenchimento
  - Formatação visual para distinguir campos obrigatórios/opcionais

## Impact

- Affected specs: `student-management` (nova capability ou modificação se existir)
- Affected code:
  - `app/(modules)/usuario/(gestao)/alunos/components/client-page.tsx` - integrar dialog de importação
  - `app/(modules)/usuario/(gestao)/alunos/components/student-import-dialog.tsx` - novo componente
  - Reutilizar API existente: `app/api/student/bulk-import/route.ts`
