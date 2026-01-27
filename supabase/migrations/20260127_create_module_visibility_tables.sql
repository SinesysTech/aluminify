-- Migration: Create module visibility tables
-- Description: Tables for configuring which navigation modules are visible to students per tenant
-- Author: Module Visibility System
-- Date: 2026-01-27

-- 1. Create table for module definitions (reference/seed data)
create table if not exists public.module_definitions (
    id text primary key,                      -- Stable identifier like 'dashboard', 'estudos', 'cronograma'
    name text not null,                       -- Display name: 'Dashboard', 'Estudos', etc.
    description text,                         -- Description for admin UI
    icon_name text not null,                  -- Lucide icon name: 'LayoutDashboard', 'BookOpen', etc.
    default_url text not null,                -- Default route: '/dashboard', '/sala-de-estudos', etc.
    display_order integer not null default 0, -- Sort order in sidebar
    is_core boolean default false not null,   -- Core modules cannot be disabled (e.g., dashboard)
    created_at timestamp with time zone default now() not null
);

-- 2. Create table for sub-module definitions
create table if not exists public.submodule_definitions (
    id text not null,                         -- Stable identifier like 'foco', 'biblioteca'
    module_id text not null references public.module_definitions(id) on delete cascade,
    name text not null,                       -- Display name: 'Modo Foco', 'Biblioteca', etc.
    default_url text not null,                -- Default route: '/foco', '/biblioteca', etc.
    display_order integer not null default 0, -- Sort order within parent module
    created_at timestamp with time zone default now() not null,
    primary key (module_id, id)
);

-- 3. Create tenant module visibility configuration table
create table if not exists public.tenant_module_visibility (
    id uuid default gen_random_uuid() primary key,
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    module_id text not null references public.module_definitions(id) on delete cascade,
    is_visible boolean default true not null,
    custom_name text,                         -- Optional custom display name
    custom_url text,                          -- Optional custom URL override
    options jsonb default '{}'::jsonb,        -- Future extensibility
    display_order integer,                    -- Override default display order
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    created_by uuid references auth.users(id),
    updated_by uuid references auth.users(id),

    -- One config per module per empresa
    unique(empresa_id, module_id)
);

-- 4. Create tenant submodule visibility configuration table
create table if not exists public.tenant_submodule_visibility (
    id uuid default gen_random_uuid() primary key,
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    module_id text not null,
    submodule_id text not null,
    is_visible boolean default true not null,
    custom_name text,                         -- Optional custom display name
    custom_url text,                          -- Optional custom URL override
    display_order integer,                    -- Override default display order
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    created_by uuid references auth.users(id),
    updated_by uuid references auth.users(id),

    -- Foreign key to submodule definition
    foreign key (module_id, submodule_id) references public.submodule_definitions(module_id, id) on delete cascade,

    -- One config per submodule per empresa
    unique(empresa_id, module_id, submodule_id)
);

-- 5. Seed default module definitions
insert into public.module_definitions (id, name, description, icon_name, default_url, display_order, is_core) values
    ('dashboard', 'Dashboard', 'Painel principal com resumo das atividades', 'LayoutDashboard', '/dashboard', 1, true),
    ('estudos', 'Estudos', 'Sala de estudos com materiais e atividades', 'BookOpen', '/sala-de-estudos', 2, false),
    ('cronograma', 'Cronograma', 'Planejamento e cronograma de estudos', 'CalendarCheck', '/cronograma', 3, false),
    ('agendamentos', 'Agendamentos', 'Sistema de agendamentos e mentorias', 'Calendar', '/agendamentos', 4, false),
    ('tobias', 'TobIAs', 'Assistente de IA para estudos', 'MessageSquare', '/tobias', 5, false)
on conflict (id) do nothing;

-- 6. Seed default submodule definitions
insert into public.submodule_definitions (module_id, id, name, default_url, display_order) values
    ('estudos', 'foco', 'Modo Foco', '/foco', 1),
    ('estudos', 'biblioteca', 'Biblioteca', '/biblioteca', 2),
    ('estudos', 'flashcards', 'Flashcards', '/flashcards', 3),
    ('agendamentos', 'meus', 'Meus Agendamentos', '/agendamentos/meus', 1),
    ('agendamentos', 'agendar', 'Agendar', '/agendamentos', 2)
on conflict (module_id, id) do nothing;

-- 7. Create triggers for updated_at
create trigger handle_updated_at_tenant_module_visibility
    before update on public.tenant_module_visibility
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at_tenant_submodule_visibility
    before update on public.tenant_submodule_visibility
    for each row
    execute function public.handle_updated_at();

-- 8. Enable RLS
alter table public.module_definitions enable row level security;
alter table public.submodule_definitions enable row level security;
alter table public.tenant_module_visibility enable row level security;
alter table public.tenant_submodule_visibility enable row level security;

-- 9. RLS policies for module_definitions (read-only for all authenticated users)
create policy "All authenticated users can view module definitions"
    on public.module_definitions
    for select
    to authenticated
    using (true);

create policy "All authenticated users can view submodule definitions"
    on public.submodule_definitions
    for select
    to authenticated
    using (true);

-- 10. RLS policies for tenant_module_visibility
create policy "Users can view their empresa module visibility"
    on public.tenant_module_visibility
    for select
    to authenticated
    using (
        empresa_id in (
            select empresa_id from public.professores where id = (select auth.uid())
            union
            select empresa_id from public.alunos_cursos ac
            join public.cursos c on ac.curso_id = c.id
            where ac.aluno_id = (select auth.uid())
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Empresa admins can manage module visibility"
    on public.tenant_module_visibility
    for all
    to authenticated
    using (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = tenant_module_visibility.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = tenant_module_visibility.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 11. RLS policies for tenant_submodule_visibility
create policy "Users can view their empresa submodule visibility"
    on public.tenant_submodule_visibility
    for select
    to authenticated
    using (
        empresa_id in (
            select empresa_id from public.professores where id = (select auth.uid())
            union
            select empresa_id from public.alunos_cursos ac
            join public.cursos c on ac.curso_id = c.id
            where ac.aluno_id = (select auth.uid())
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Empresa admins can manage submodule visibility"
    on public.tenant_submodule_visibility
    for all
    to authenticated
    using (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = tenant_submodule_visibility.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = tenant_submodule_visibility.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 12. Create indexes for performance
create index if not exists idx_tenant_module_visibility_empresa_id
    on public.tenant_module_visibility(empresa_id);
create index if not exists idx_tenant_module_visibility_module_id
    on public.tenant_module_visibility(module_id);
create index if not exists idx_tenant_submodule_visibility_empresa_id
    on public.tenant_submodule_visibility(empresa_id);
create index if not exists idx_tenant_submodule_visibility_module_id
    on public.tenant_submodule_visibility(module_id);

-- 13. Add comments
comment on table public.module_definitions is 'Reference table defining available navigation modules for the student sidebar';
comment on table public.submodule_definitions is 'Reference table defining sub-items for navigation modules';
comment on table public.tenant_module_visibility is 'Per-tenant configuration for module visibility, names, and order in student navigation';
comment on table public.tenant_submodule_visibility is 'Per-tenant configuration for submodule visibility, names, and order in student navigation';
