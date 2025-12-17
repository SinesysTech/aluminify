-- Migration: Migrate agendamento_disponibilidade to agendamento_recorrencia
-- Description: Copia dados existentes de disponibilidade semanal para padrões de recorrência anual
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Inserir dados de agendamento_disponibilidade em agendamento_recorrencia
-- Definir data_inicio como data atual e data_fim como null (recorrência indefinida)
-- Definir duracao_slot_minutos como 30 (padrão atual)
-- Definir tipo_servico como 'plantao' por padrão
-- Adicionar empresa_id buscando de professores.empresa_id

insert into public.agendamento_recorrencia (
    professor_id,
    empresa_id,
    tipo_servico,
    data_inicio,
    data_fim,
    dia_semana,
    hora_inicio,
    hora_fim,
    duracao_slot_minutos,
    ativo,
    created_at,
    updated_at
)
select
    ad.professor_id,
    coalesce(p.empresa_id, (select id from public.empresas limit 1)) as empresa_id,
    'plantao'::enum_tipo_servico_agendamento as tipo_servico,
    current_date as data_inicio,
    null as data_fim, -- recorrência indefinida
    ad.dia_semana,
    ad.hora_inicio,
    ad.hora_fim,
    30 as duracao_slot_minutos, -- padrão atual
    ad.ativo,
    ad.created_at,
    ad.updated_at
from public.agendamento_disponibilidade ad
left join public.professores p on p.id = ad.professor_id
where not exists (
    -- Evitar duplicatas se a migração já foi executada
    select 1
    from public.agendamento_recorrencia ar
    where ar.professor_id = ad.professor_id
    and ar.dia_semana = ad.dia_semana
    and ar.hora_inicio = ad.hora_inicio
    and ar.hora_fim = ad.hora_fim
    and ar.data_inicio = current_date
    and ar.data_fim is null
);

-- 2. Adicionar comentário explicativo
comment on table public.agendamento_disponibilidade is 'Tabela legada mantida para compatibilidade. Use agendamento_recorrencia para novos padrões de disponibilidade.';

