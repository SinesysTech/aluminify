-- Migration: Create empresa_admins table
-- Description: Tabela para vincular múltiplos admins por empresa
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Adicionar coluna is_admin na tabela professores
alter table public.professores
    add column if not exists is_admin boolean default false not null;

-- 2. Criar tabela empresa_admins
create table if not exists public.empresa_admins (
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    is_owner boolean default false not null,
    permissoes jsonb default '{}'::jsonb,
    created_at timestamp with time zone default now() not null,
    primary key (empresa_id, user_id)
);

-- 3. Adicionar comentário na tabela
comment on table public.empresa_admins is 'Tabela de relacionamento entre empresas e administradores. Permite múltiplos admins por empresa, com um owner principal.';

-- 4. Criar índices
create index if not exists idx_empresa_admins_empresa_id on public.empresa_admins(empresa_id);
create index if not exists idx_empresa_admins_user_id on public.empresa_admins(user_id);
create index if not exists idx_professores_is_admin on public.professores(is_admin) where is_admin = true;

-- 5. Habilitar RLS na tabela empresa_admins
alter table public.empresa_admins enable row level security;

-- 6. Criar função para verificar se usuário é admin de uma empresa
create or replace function public.is_empresa_admin(user_id_param uuid, empresa_id_param uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- Fast-path: reject null params early to avoid unnecessary queries
    if user_id_param is null or empresa_id_param is null then
        return false;
    end if;

    return exists (
        select 1
        from public.empresa_admins
        where empresa_admins.empresa_id = is_empresa_admin.empresa_id_param
        and empresa_admins.user_id = is_empresa_admin.user_id_param
    )
    or exists (
        select 1
        from public.professores
        where professores.id = is_empresa_admin.user_id_param
        and professores.empresa_id = is_empresa_admin.empresa_id_param
        and professores.is_admin = true
    );
end;
$$;

-- 7. Criar função para verificar se usuário logado é admin de sua empresa
create or replace function public.is_empresa_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    user_empresa_id uuid;
    current_uid uuid;
begin
    -- Fast-path: no authenticated user
    current_uid := (select auth.uid());
    if current_uid is null then
        return false;
    end if;

    user_empresa_id := public.get_user_empresa_id();

    if user_empresa_id is null then
        return false;
    end if;

    return public.is_empresa_admin(current_uid, user_empresa_id);
end;
$$;

-- 8. Criar RLS policies para empresa_admins
create policy "Admins veem admins de sua empresa"
    on public.empresa_admins
    for select
    to authenticated
    using (
        -- Admin da empresa
        public.is_empresa_admin((select auth.uid()), empresa_id)
    );

create policy "Apenas owner pode adicionar admins"
    on public.empresa_admins
    for insert
    to authenticated
    with check (
        -- Owner da empresa
        exists (
            select 1
            from public.empresa_admins
            where empresa_id = empresa_admins.empresa_id
            and user_id = (select auth.uid())
            and is_owner = true
        )
    );

create policy "Apenas owner pode remover admins"
    on public.empresa_admins
    for delete
    to authenticated
    using (
        -- Owner da empresa (não pode remover a si mesmo se for o único owner)
        exists (
            select 1
            from public.empresa_admins
            where empresa_id = empresa_admins.empresa_id
            and user_id = (select auth.uid())
            and is_owner = true
        )
        and user_id != (select auth.uid())
    );

-- 9. Adicionar comentários nas funções
comment on function public.is_empresa_admin(uuid, uuid) is 'Verifica se um usuário é admin de uma empresa específica.';
comment on function public.is_empresa_admin() is 'Verifica se o usuário logado é admin de sua empresa.';

