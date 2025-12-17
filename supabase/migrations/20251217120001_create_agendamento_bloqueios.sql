-- Migration: Create agendamento_bloqueios table
-- Description: Tabela para bloqueios de agenda (feriados, recessos, imprevistos)
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Criar ENUM para tipo de bloqueio
create type enum_tipo_bloqueio as enum ('feriado', 'recesso', 'imprevisto', 'outro');

-- 2. Criar tabela agendamento_bloqueios
create table if not exists public.agendamento_bloqueios (
    id uuid default gen_random_uuid() primary key,
    professor_id uuid references auth.users(id) on delete cascade, -- null = bloqueio para toda empresa
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    tipo enum_tipo_bloqueio not null default 'outro',
    data_inicio timestamp with time zone not null,
    data_fim timestamp with time zone not null,
    motivo text,
    criado_por uuid not null references auth.users(id) on delete restrict,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint check_data_fim_after_inicio check (data_fim > data_inicio)
);

-- 3. Adicionar comentário na tabela
comment on table public.agendamento_bloqueios is 'Bloqueios de agenda que impedem agendamentos em períodos específicos. Podem ser por professor (professor_id preenchido) ou para toda a empresa (professor_id null).';

-- 4. Habilitar RLS
alter table public.agendamento_bloqueios enable row level security;

-- 5. Criar RLS policies
-- Professores veem seus bloqueios e bloqueios da empresa
create policy "Professores veem bloqueios relevantes"
    on public.agendamento_bloqueios
    for select
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        and (
            professor_id is null
            or professor_id = (select auth.uid())
        )
    );

-- Professores podem criar bloqueios próprios
create policy "Professores podem criar bloqueios próprios"
    on public.agendamento_bloqueios
    for insert
    to authenticated
    with check (
        empresa_id = public.get_user_empresa_id()
        and (
            professor_id is null
            or professor_id = (select auth.uid())
        )
        and criado_por = (select auth.uid())
    );

-- Admins podem criar bloqueios para toda empresa
create policy "Admins podem criar bloqueios da empresa"
    on public.agendamento_bloqueios
    for insert
    to authenticated
    with check (
        empresa_id = public.get_user_empresa_id()
        and professor_id is null
        and exists (
            select 1
            from public.professores
            where id = (select auth.uid())
            and empresa_id = agendamento_bloqueios.empresa_id
            and is_admin = true
        )
    );

-- Professores podem atualizar seus bloqueios
create policy "Professores podem atualizar bloqueios próprios"
    on public.agendamento_bloqueios
    for update
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        and professor_id = (select auth.uid())
    )
    with check (
        empresa_id = public.get_user_empresa_id()
        and professor_id = (select auth.uid())
    );

-- Admins podem atualizar bloqueios da empresa
create policy "Admins podem atualizar bloqueios da empresa"
    on public.agendamento_bloqueios
    for update
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        and professor_id is null
        and exists (
            select 1
            from public.professores
            where id = (select auth.uid())
            and empresa_id = agendamento_bloqueios.empresa_id
            and is_admin = true
        )
    )
    with check (
        empresa_id = public.get_user_empresa_id()
        and professor_id is null
        and exists (
            select 1
            from public.professores
            where id = (select auth.uid())
            and empresa_id = agendamento_bloqueios.empresa_id
            and is_admin = true
        )
    );

-- Professores podem deletar seus bloqueios
create policy "Professores podem deletar bloqueios próprios"
    on public.agendamento_bloqueios
    for delete
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        and professor_id = (select auth.uid())
    );

-- Admins podem deletar bloqueios da empresa
create policy "Admins podem deletar bloqueios da empresa"
    on public.agendamento_bloqueios
    for delete
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        and professor_id is null
        and exists (
            select 1
            from public.professores
            where id = (select auth.uid())
            and empresa_id = agendamento_bloqueios.empresa_id
            and is_admin = true
        )
    );

-- Alunos podem ver bloqueios para validação de agendamentos
create policy "Alunos podem ver bloqueios para agendamento"
    on public.agendamento_bloqueios
    for select
    to authenticated
    using (
        empresa_id in (
            select distinct cursos.empresa_id
            from public.alunos_cursos
            inner join public.cursos on cursos.id = alunos_cursos.curso_id
            where alunos_cursos.aluno_id = (select auth.uid())
        )
    );

-- 6. Criar índices para performance
create index if not exists idx_agendamento_bloqueios_professor_empresa_data
    on public.agendamento_bloqueios(professor_id, empresa_id, data_inicio, data_fim);

create index if not exists idx_agendamento_bloqueios_empresa_tipo_data
    on public.agendamento_bloqueios(empresa_id, tipo, data_inicio);

create index if not exists idx_agendamento_bloqueios_periodo
    on public.agendamento_bloqueios using gist (tstzrange(data_inicio, data_fim));

-- 7. Criar trigger para updated_at
create trigger handle_updated_at_agendamento_bloqueios
    before update on public.agendamento_bloqueios
    for each row
    execute function public.handle_updated_at();

