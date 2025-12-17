-- Migration: Create agendamento_recorrencia table
-- Description: Tabela para padrões de recorrência anual de disponibilidade de professores
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Criar ENUM para tipo de serviço
create type enum_tipo_servico_agendamento as enum ('plantao', 'mentoria');

-- 2. Criar tabela agendamento_recorrencia
create table if not exists public.agendamento_recorrencia (
    id uuid default gen_random_uuid() primary key,
    professor_id uuid not null references auth.users(id) on delete cascade,
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    tipo_servico enum_tipo_servico_agendamento not null default 'plantao',
    data_inicio date not null,
    data_fim date, -- null = recorrência indefinida
    dia_semana int not null check (dia_semana between 0 and 6), -- 0=Sunday, 6=Saturday
    hora_inicio time not null,
    hora_fim time not null,
    duracao_slot_minutos int not null default 30 check (duracao_slot_minutos in (15, 30, 45, 60)),
    ativo boolean default true not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint check_data_fim_after_inicio check (data_fim is null or data_fim >= data_inicio),
    constraint check_hora_fim_after_inicio check (hora_fim > hora_inicio)
);

-- 3. Adicionar comentário na tabela
comment on table public.agendamento_recorrencia is 'Padrões de recorrência anual de disponibilidade de professores. Permite definir horários de disponibilidade que se repetem em dias específicos da semana dentro de um período de vigência.';

-- 4. Habilitar RLS
alter table public.agendamento_recorrencia enable row level security;

-- 5. Criar RLS policies
-- Professores veem apenas suas recorrências
create policy "Professores veem suas recorrências"
    on public.agendamento_recorrencia
    for select
    to authenticated
    using (
        (select auth.uid()) = professor_id
        and empresa_id = public.get_user_empresa_id()
    );

-- Professores podem inserir suas recorrências
create policy "Professores podem criar recorrências"
    on public.agendamento_recorrencia
    for insert
    to authenticated
    with check (
        (select auth.uid()) = professor_id
        and empresa_id = public.get_user_empresa_id()
    );

-- Professores podem atualizar suas recorrências
create policy "Professores podem atualizar recorrências"
    on public.agendamento_recorrencia
    for update
    to authenticated
    using (
        (select auth.uid()) = professor_id
        and empresa_id = public.get_user_empresa_id()
    )
    with check (
        (select auth.uid()) = professor_id
        and empresa_id = public.get_user_empresa_id()
    );

-- Professores podem deletar suas recorrências
create policy "Professores podem deletar recorrências"
    on public.agendamento_recorrencia
    for delete
    to authenticated
    using (
        (select auth.uid()) = professor_id
        and empresa_id = public.get_user_empresa_id()
    );

-- Alunos podem ver recorrências ativas para agendamento
create policy "Alunos podem ver recorrências ativas"
    on public.agendamento_recorrencia
    for select
    to authenticated
    using (
        ativo = true
        and (
            data_fim is null
            or data_fim >= current_date
        )
        and data_inicio <= current_date
    );

-- 6. Criar índices para performance
create index if not exists idx_agendamento_recorrencia_professor_empresa_ativo
    on public.agendamento_recorrencia(professor_id, empresa_id, ativo);

create index if not exists idx_agendamento_recorrencia_data_periodo
    on public.agendamento_recorrencia(data_inicio, data_fim);

create index if not exists idx_agendamento_recorrencia_dia_semana
    on public.agendamento_recorrencia(dia_semana) where ativo = true;

create index if not exists idx_agendamento_recorrencia_empresa
    on public.agendamento_recorrencia(empresa_id);

-- 7. Criar trigger para updated_at
create trigger handle_updated_at_agendamento_recorrencia
    before update on public.agendamento_recorrencia
    for each row
    execute function public.handle_updated_at();

