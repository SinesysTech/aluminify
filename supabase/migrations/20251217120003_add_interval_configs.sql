-- Migration: Add interval configurations to agendamento_configuracoes
-- Description: Adiciona configurações de duração de slots por tipo de serviço
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Adicionar colunas em agendamento_configuracoes
alter table public.agendamento_configuracoes
add column if not exists duracao_slot_plantao_minutos int default 15,
add column if not exists duracao_slot_mentoria_minutos int default 30,
add column if not exists permitir_ajuste_intervalos boolean default true;

-- 2. Adicionar constraints
alter table public.agendamento_configuracoes
add constraint check_duracao_slot_plantao
    check (duracao_slot_plantao_minutos in (15, 30, 45, 60));

alter table public.agendamento_configuracoes
add constraint check_duracao_slot_mentoria
    check (duracao_slot_mentoria_minutos in (15, 30, 45, 60));

-- 3. Atualizar registros existentes com valores padrão
update public.agendamento_configuracoes
set
    duracao_slot_plantao_minutos = coalesce(duracao_slot_plantao_minutos, 15),
    duracao_slot_mentoria_minutos = coalesce(duracao_slot_mentoria_minutos, 30),
    permitir_ajuste_intervalos = coalesce(permitir_ajuste_intervalos, true)
where
    duracao_slot_plantao_minutos is null
    or duracao_slot_mentoria_minutos is null
    or permitir_ajuste_intervalos is null;

-- 4. Adicionar comentários
comment on column public.agendamento_configuracoes.duracao_slot_plantao_minutos is 'Duração padrão dos slots de plantão em minutos (15, 30, 45 ou 60).';
comment on column public.agendamento_configuracoes.duracao_slot_mentoria_minutos is 'Duração padrão dos slots de mentoria em minutos (15, 30, 45 ou 60).';
comment on column public.agendamento_configuracoes.permitir_ajuste_intervalos is 'Permite que o professor ajuste intervalos por padrão de recorrência.';

