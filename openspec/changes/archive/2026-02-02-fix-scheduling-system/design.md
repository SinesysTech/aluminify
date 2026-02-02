# Technical Design: Fix Scheduling System

## Context

O sistema de agendamento foi implementado com uma arquitetura inicial que evoluiu de forma inconsistente:

1. Duas tabelas de disponibilidade coexistem (`agendamento_disponibilidade` legada e `agendamento_recorrencia` nova)
2. Frontend e backend usam tabelas diferentes
3. Rota de agendamentos nao suporta selecao de professor
4. Integracao com provedores de reuniao implementada mas sem UI

### Stakeholders
- **Alunos**: Precisam agendar atendimentos facilmente
- **Professores**: Precisam gerenciar disponibilidade e confirmar agendamentos
- **Admins**: Precisam visualizar relatorios e gerenciar bloqueios da empresa

## Goals / Non-Goals

### Goals
- Corrigir todas as falhas criticas que impedem uso em producao
- Unificar uso de tabela de disponibilidade
- Implementar UIs faltantes para funcionalidades existentes
- Manter compatibilidade com agendamentos ja existentes

### Non-Goals
- Redesign completo da UI (melhorias pontuais apenas)
- Migracao de dados existentes (apenas correcao de fluxo)
- Implementacao de notificacoes push/email (manter triggers existentes)
- Sistema de pagamentos ou cobranca

## Decisions

### D1: Deprecar `agendamento_disponibilidade` em favor de `agendamento_recorrencia`

**Decision**: Usar apenas `agendamento_recorrencia` para toda logica de disponibilidade.

**Rationale**:
- `agendamento_recorrencia` tem campos mais ricos (tipo_servico, duracao_slot, periodo de vigencia)
- Evita manter duas fontes de verdade
- Queries mais simples e consistentes

**Alternatives considered**:
- Manter ambas tabelas com sync: Complexidade desnecessaria
- Migrar dados automaticamente: Risco de perda de dados

**Migration**:
- Manter tabela antiga para historico
- Novos registros apenas em `agendamento_recorrencia`
- Criar view unificada se necessario para reports

### D2: Rota dinamica `/agendamentos/[professorId]`

**Decision**: Alterar estrutura de rotas para suportar selecao de professor.

**New Routes**:
```
/agendamentos              -> Lista de professores disponiveis
/agendamentos/[professorId] -> Calendario de agendamento
/meus-agendamentos         -> (mantido) Lista de agendamentos do aluno
```

**Rationale**:
- Padrao comum em sistemas de booking (Calendly, Cal.com)
- Permite deep-linking para professor especifico
- Separa selecao de agendamento

### D3: Verificacao de permissao em Server Actions

**Decision**: Adicionar verificacao explicita em todas as actions de mutacao.

**Pattern**:
```typescript
export async function cancelAgendamento(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // Verificar propriedade
  const { data: agendamento } = await supabase
    .from('agendamentos')
    .select('aluno_id, professor_id')
    .eq('id', id)
    .single()

  if (!agendamento) throw new Error('Not found')

  const isOwner = agendamento.aluno_id === user.id || agendamento.professor_id === user.id
  if (!isOwner) throw new Error('Forbidden')

  // ... resto da logica
}
```

**Rationale**:
- RLS protege no nivel do banco, mas erro mais claro no app
- Permite logging de tentativas de acesso indevido
- Defense in depth

### D4: Timezone - Padronizar em UTC com display local

**Decision**: Armazenar sempre em UTC, exibir no timezone do usuario.

**Implementation**:
- Backend: Todas operacoes em UTC (`getUTCDay()`, `toISOString()`)
- Frontend: Converter para local ao exibir (`toLocaleString('pt-BR', { timeZone })`)
- Database: Colunas `timestamp with time zone` (ja existente)

**Rationale**:
- Evita ambiguidade em comparacoes
- Suporta usuarios em fusos diferentes
- Padrao da industria

### D5: Duracao dinamica de slots

**Decision**: Passar duracao como parametro em vez de hardcoded.

**Flow**:
1. `getAvailableSlots` retorna array de `{ start: string, duration: number }`
2. `RightPanel` exibe slots com duracao
3. `FormPanel` recebe duracao selecionada
4. `createAgendamento` calcula `data_fim` baseado na duracao

**Alternative considered**:
- Sempre usar duracao da configuracao do professor: Menos flexivel

### D6: Estrutura de componentes do Professor

**Decision**: Criar area unificada de configuracoes.

**Structure**:
```
/professor/
  /agendamentos           -> Dashboard de agendamentos
  /disponibilidade        -> RecorrenciaManager (novo)
  /bloqueios              -> BloqueiosManager (novo)
  /configuracoes          -> ConfiguracoesProfessor (existente)
    /integracoes          -> IntegracaoManager (novo)
  /relatorios             -> RelatoriosDashboard (novo)
```

## Risks / Trade-offs

### R1: Breaking Change na Rota de Agendamentos
- **Risk**: Links externos ou bookmarks quebram
- **Mitigation**: Redirect da rota antiga para nova com query param

### R2: Dados antigos em `agendamento_disponibilidade`
- **Risk**: Professores que configuraram disponibilidade perdem configs
- **Mitigation**: Manter tabela, criar script de migracao manual, notificar usuarios

### R3: Complexidade do OAuth para Google/Zoom
- **Risk**: Configuracao de OAuth pode ser complexa para deploy
- **Mitigation**: Manter fallback para link padrao, documentar setup

### R4: Performance de `getProfessoresDisponiveis`
- **Risk**: Query pesada se muitos professores
- **Mitigation**: Paginacao, cache, ou pre-calculo de disponibilidade

## Migration Plan

### Step 1: Deploy Changes Incrementally
1. Deploy P0 fixes primeiro (seguranca, correcoes criticas)
2. Deploy P1 features (UIs novas)
3. Deploy P2/P3 melhorias

### Step 2: Data Migration (if needed)
```sql
-- Script para migrar dados de agendamento_disponibilidade para agendamento_recorrencia
-- Executar manualmente apos backup

INSERT INTO agendamento_recorrencia (
  professor_id, empresa_id, tipo_servico,
  data_inicio, data_fim, dia_semana,
  hora_inicio, hora_fim, duracao_slot_minutos, ativo
)
SELECT
  d.professor_id,
  p.empresa_id,
  'mentoria'::enum_tipo_servico_agendamento,
  CURRENT_DATE,
  NULL,
  d.dia_semana,
  d.hora_inicio,
  d.hora_fim,
  30,
  d.ativo
FROM agendamento_disponibilidade d
JOIN professores p ON p.id = d.professor_id
WHERE NOT EXISTS (
  SELECT 1 FROM agendamento_recorrencia r
  WHERE r.professor_id = d.professor_id
  AND r.dia_semana = d.dia_semana
);
```

### Step 3: Rollback Plan
- Manter tabela `agendamento_disponibilidade` intacta
- Feature flags para novas rotas
- Revert deploy se problemas criticos

## Open Questions

1. **Q**: Devemos manter a rota `/agendamentos` com redirect permanente ou remover completamente?
   - **Recommendation**: Redirect 301 por 3 meses, depois 404

2. **Q**: Como lidar com professores que nao configuraram recorrencia?
   - **Recommendation**: Mostrar mensagem "Professor sem horarios disponiveis" e esconder do seletor

3. **Q**: Implementar reagendamento como feature separada ou junto com este change?
   - **Recommendation**: Separar em outro change proposal para manter escopo gerenciavel

4. **Q**: Relatórios devem ser acessiveis por professores individuais ou apenas admin da empresa?
   - **Recommendation**: Professores veem seus proprios dados, admin ve consolidado
