-- Migration: Create empresas table
-- Description: Tabela de empresas (cursinhos) como entidade central do multi-tenancy
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Criar ENUM para planos de empresa
create type enum_plano_empresa as enum ('basico', 'profissional', 'enterprise');

-- 2. Criar tabela empresas
create table if not exists public.empresas (
    id uuid default gen_random_uuid() primary key,
    nome text not null,
    slug text unique not null,
    cnpj text unique,
    email_contato text,
    telefone text,
    logo_url text,
    plano enum_plano_empresa default 'basico' not null,
    ativo boolean default true not null,
    configuracoes jsonb default '{}'::jsonb,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- 3. Adicionar comentário na tabela
comment on table public.empresas is 'Tabela de empresas (cursinhos) que representa cada tenant do sistema multi-tenant. Cada empresa possui seus próprios professores, cursos e alunos.';

-- 4. Criar trigger para atualizar updated_at
create trigger handle_updated_at_empresas
    before update on public.empresas
    for each row
    execute function public.handle_updated_at();

-- 5. Habilitar RLS na tabela empresas
alter table public.empresas enable row level security;

-- 6. Criar função auxiliar para obter empresa_id do usuário
-- Esta função será usada nas RLS policies
create or replace function public.get_user_empresa_id()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
    empresa_id_result uuid;
begin
    -- Busca empresa_id do professor logado
    select empresa_id
    into empresa_id_result
    from public.professores
    where id = (select auth.uid())
    limit 1;

    return empresa_id_result;
end;
$$;

-- 7. Criar RLS policy: Usuários veem apenas sua empresa
create policy "Usuários veem apenas sua empresa"
    on public.empresas
    for select
    to authenticated
    using (
        -- Professores veem apenas sua empresa
        (select auth.uid()) in (
            select id from public.professores where empresa_id = empresas.id
        )
        or
        -- Superadmin vê todas as empresas
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 8. Criar RLS policy: Apenas superadmin pode criar empresas
create policy "Apenas superadmin pode criar empresas"
    on public.empresas
    for insert
    to authenticated
    with check (
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 9. Criar RLS policy: Admins da empresa ou superadmin podem atualizar
create policy "Admins da empresa ou superadmin podem atualizar"
    on public.empresas
    for update
    to authenticated
    using (
        -- Admin da empresa
        (
            exists (
                select 1
                from public.professores
                where id = (select auth.uid())
                and empresa_id = empresas.id
                and is_admin = true
            )
        )
        or
        -- Superadmin
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    )
    with check (
        -- Admin da empresa
        (
            exists (
                select 1
                from public.professores
                where id = (select auth.uid())
                and empresa_id = empresas.id
                and is_admin = true
            )
        )
        or
        -- Superadmin
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

-- 10. Criar RLS policy: Apenas superadmin pode deletar empresas
create policy "Apenas superadmin pode deletar empresas"
    on public.empresas
    for delete
    to authenticated
    using (
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 11. Criar índices para performance
create index if not exists idx_empresas_slug on public.empresas(slug);
create index if not exists idx_empresas_cnpj on public.empresas(cnpj) where cnpj is not null;
create index if not exists idx_empresas_ativo on public.empresas(ativo);

