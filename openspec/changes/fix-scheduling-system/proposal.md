# Change: Fix and Complete Scheduling System

## Why

O sistema de agendamento atual possui falhas criticas que impedem seu uso em producao:

1. **Problema de identidade**: A pagina de agendamentos usa o proprio usuario logado como professor, impossibilitando que alunos agendem com outros professores
2. **Inconsistencia de dados**: Professor configura disponibilidade em uma tabela (`agendamento_disponibilidade`), mas slots sao gerados de outra (`agendamento_recorrencia`)
3. **Falha de seguranca**: Qualquer usuario autenticado pode cancelar qualquer agendamento
4. **Funcionalidades incompletas**: Faltam UIs para recorrencias, bloqueios, selecao de professor e integrações

## What Changes

### Correcoes Criticas (P0)

- **BREAKING**: Refatorar rota de agendamentos para `/agendamentos/[professorId]` com selecao de professor
- Migrar `AvailabilityManager` de `agendamento_disponibilidade` para `agendamento_recorrencia`
- Adicionar verificacao de permissao em `cancelAgendamento`
- Corrigir `validateAgendamento` para usar tabela correta

### Novas Funcionalidades (P1)

- Criar componente `ProfessorSelector` para alunos escolherem professor
- Criar componente `RecorrenciaManager` para professores configurarem disponibilidade
- Criar componente `BloqueiosManager` para professores e admins
- Criar componente `IntegracaoManager` para configurar Google Meet/Zoom
- Usar duracao de slot dinamica (nao hardcoded 30min)

### Melhorias de Logica (P2)

- Corrigir query de bloqueios para verificar sobreposicao corretamente
- Padronizar uso de timezone (UTC vs local)
- Implementar refresh automatico apos acoes (confirmar/rejeitar/cancelar)
- Adicionar transicao automatica para status "concluido"

### Melhorias de UX (P3)

- Destacar dias com disponibilidade no calendario
- Mostrar resumo de confirmacao antes de criar agendamento
- Melhorar mensagens de erro com detalhes
- Adicionar pagina de relatorios para empresa

### Limpeza Tecnica

- Regenerar tipos do Supabase
- Remover migracoes duplicadas
- Consolidar tipos locais com tipos gerados

## Impact

### Affected Specs
- `scheduling` (nova capability)

### Affected Code
- `app/actions/agendamentos.ts` - Server actions
- `app/(dashboard)/agendamentos/` - Rotas de agendamento
- `app/(dashboard)/meus-agendamentos/` - Lista do aluno
- `app/(dashboard)/professor/` - Area do professor
- `components/agendamento/` - Componentes de agendamento
- `components/professor/` - Componentes do professor
- `lib/agendamento-validations.ts` - Validacoes
- `supabase/migrations/` - Migracoes SQL

### Breaking Changes
- **BREAKING**: Rota `/agendamentos` sera removida em favor de `/agendamentos/[professorId]`
- **BREAKING**: Tabela `agendamento_disponibilidade` sera deprecada

### Database Changes
- Deprecar tabela `agendamento_disponibilidade`
- Adicionar funcao SQL para transicao automatica de status
- Limpar migracoes duplicadas
