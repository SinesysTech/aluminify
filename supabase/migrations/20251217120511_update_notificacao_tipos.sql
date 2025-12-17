-- Migration: Update agendamento_notificacoes.tipo CHECK constraint
-- Description: Adiciona novos tipos de notificação: bloqueio_criado, recorrencia_alterada, substituicao_solicitada
-- Author: Auto-generated
-- Date: 2025-12-17

-- Remove the old CHECK constraint
alter table public.agendamento_notificacoes
drop constraint if exists agendamento_notificacoes_tipo_check;

-- Add new CHECK constraint with additional notification types
alter table public.agendamento_notificacoes
add constraint agendamento_notificacoes_tipo_check
check (tipo in ('criacao', 'confirmacao', 'cancelamento', 'lembrete', 'alteracao', 'rejeicao', 'bloqueio_criado', 'recorrencia_alterada', 'substituicao_solicitada'));

-- Add comment
comment on constraint agendamento_notificacoes_tipo_check on public.agendamento_notificacoes is 'Tipos de notificação permitidos: criacao, confirmacao, cancelamento, lembrete, alteracao, rejeicao, bloqueio_criado, recorrencia_alterada, substituicao_solicitada';

