-- Migration: Create agendamento_relatorios table
-- Description: Tabela para armazenar relatórios pré-calculados de agendamentos
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Criar ENUM para tipo de relatório
create type enum_tipo_relatorio as enum ('mensal', 'semanal', 'customizado');

-- 2. Criar tabela agendamento_relatorios
create table if not exists public.agendamento_relatorios (
    id uuid default gen_random_uuid() primary key,
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    periodo_inicio date not null,
    periodo_fim date not null,
    tipo enum_tipo_relatorio not null,
    dados_json jsonb not null default '{}'::jsonb,
    gerado_em timestamp with time zone default now() not null,
    gerado_por uuid not null references auth.users(id) on delete restrict,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint check_periodo_fim_after_inicio check (periodo_fim >= periodo_inicio)
);

-- 3. Adicionar comentário na tabela
comment on table public.agendamento_relatorios is 'Relatórios pré-calculados de agendamentos com estatísticas agregadas por período. Os dados são armazenados em formato JSONB para flexibilidade.';

-- 4. Habilitar RLS
alter table public.agendamento_relatorios enable row level security;

-- 5. Criar RLS policies
-- Professores veem relatórios da própria empresa
create policy "Professores veem relatórios da empresa"
    on public.agendamento_relatorios
    for select
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
    );

-- Professores podem criar relatórios da própria empresa
create policy "Professores podem criar relatórios"
    on public.agendamento_relatorios
    for insert
    to authenticated
    with check (
        empresa_id = public.get_user_empresa_id()
        and gerado_por = (select auth.uid())
    );

-- Professores podem atualizar relatórios da própria empresa
create policy "Professores podem atualizar relatórios"
    on public.agendamento_relatorios
    for update
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
    )
    with check (
        empresa_id = public.get_user_empresa_id()
    );

-- Professores podem deletar relatórios da própria empresa
create policy "Professores podem deletar relatórios"
    on public.agendamento_relatorios
    for delete
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
    );

-- 6. Criar índices para performance
create index if not exists idx_agendamento_relatorios_empresa_periodo
    on public.agendamento_relatorios(empresa_id, periodo_inicio, periodo_fim);

create index if not exists idx_agendamento_relatorios_tipo
    on public.agendamento_relatorios(tipo);

create index if not exists idx_agendamento_relatorios_gerado_em
    on public.agendamento_relatorios(gerado_em desc);

-- 7. Criar trigger para updated_at
create trigger handle_updated_at_agendamento_relatorios
    before update on public.agendamento_relatorios
    for each row
    execute function public.handle_updated_at();

-- 8. Criar funções SQL para cálculos de métricas
create or replace function public.calcular_taxa_ocupacao(
    empresa_id_param uuid,
    data_inicio_param date,
    data_fim_param date
)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
    total_slots numeric;
    slots_ocupados numeric;
    taxa numeric;
begin
    -- Calcular total de slots disponíveis no período
    -- Baseado em agendamento_recorrencia
    select count(*)
    into total_slots
    from public.agendamento_recorrencia ar
    inner join public.professores p on p.id = ar.professor_id
    where p.empresa_id = calcular_taxa_ocupacao.empresa_id_param
    and ar.ativo = true
    and ar.data_inicio <= calcular_taxa_ocupacao.data_fim_param
    and (ar.data_fim is null or ar.data_fim >= calcular_taxa_ocupacao.data_inicio_param);

    -- Calcular slots ocupados (agendamentos confirmados ou concluídos)
    select count(*)
    into slots_ocupados
    from public.agendamentos a
    inner join public.professores p on p.id = a.professor_id
    where p.empresa_id = calcular_taxa_ocupacao.empresa_id_param
    and a.status in ('confirmado', 'concluido')
    and date(a.data_inicio) >= calcular_taxa_ocupacao.data_inicio_param
    and date(a.data_fim) <= calcular_taxa_ocupacao.data_fim_param;

    -- Calcular taxa (0 a 1)
    if total_slots > 0 then
        taxa := slots_ocupados / total_slots;
    else
        taxa := 0;
    end if;

    return coalesce(taxa, 0);
end;
$$;

create or replace function public.calcular_taxa_comparecimento(
    professor_id_param uuid,
    data_inicio_param date,
    data_fim_param date
)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
    total_confirmados numeric;
    total_concluidos numeric;
    taxa numeric;
begin
    -- Contar agendamentos confirmados
    select count(*)
    into total_confirmados
    from public.agendamentos
    where professor_id = calcular_taxa_comparecimento.professor_id_param
    and status = 'confirmado'
    and date(data_inicio) >= calcular_taxa_comparecimento.data_inicio_param
    and date(data_fim) <= calcular_taxa_comparecimento.data_fim_param;

    -- Contar agendamentos concluídos
    select count(*)
    into total_concluidos
    from public.agendamentos
    where professor_id = calcular_taxa_comparecimento.professor_id_param
    and status = 'concluido'
    and date(data_inicio) >= calcular_taxa_comparecimento.data_inicio_param
    and date(data_fim) <= calcular_taxa_comparecimento.data_fim_param;

    -- Calcular taxa (0 a 1)
    if total_confirmados > 0 then
        taxa := total_concluidos / total_confirmados;
    else
        taxa := 0;
    end if;

    return coalesce(taxa, 0);
end;
$$;

create or replace function public.listar_horarios_vagos(
    empresa_id_param uuid,
    data_inicio_param date,
    data_fim_param date
)
returns table(
    data date,
    hora_inicio time,
    hora_fim time,
    professor_id uuid,
    professor_nome text
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
    return query
    select
        d.data,
        ar.hora_inicio,
        ar.hora_fim,
        ar.professor_id,
        p.nome_completo as professor_nome
    from generate_series(
        listar_horarios_vagos.data_inicio_param,
        listar_horarios_vagos.data_fim_param,
        interval '1 day'
    ) as d(data)
    cross join public.agendamento_recorrencia ar
    inner join public.professores p on p.id = ar.professor_id
    where p.empresa_id = listar_horarios_vagos.empresa_id_param
    and ar.ativo = true
    and extract(dow from d.data) = ar.dia_semana
    and ar.data_inicio <= d.data
    and (ar.data_fim is null or ar.data_fim >= d.data)
    and not exists (
        select 1
        from public.agendamentos a
        where a.professor_id = ar.professor_id
        and date(a.data_inicio) = d.data
        and a.status != 'cancelado'
    )
    order by d.data, ar.hora_inicio;
end;
$$;

-- 9. Adicionar comentários nas funções
comment on function public.calcular_taxa_ocupacao(uuid, date, date) is 'Calcula a taxa de ocupação de slots de agendamento para uma empresa no período especificado. Retorna valor entre 0 e 1.';
comment on function public.calcular_taxa_comparecimento(uuid, date, date) is 'Calcula a taxa de comparecimento de um professor (concluídos / confirmados) no período especificado. Retorna valor entre 0 e 1.';
comment on function public.listar_horarios_vagos(uuid, date, date) is 'Lista horários vagos (disponíveis mas não agendados) para uma empresa no período especificado.';

