-- Migration: Fix module visibility RLS policies to avoid accessing auth.users directly
-- Description: Updates RLS policies to use is_superadmin() function instead of directly querying auth.users
-- This fixes the "permission denied for table users" error

-- 1. Drop existing policies for tenant_module_visibility
drop policy if exists "Users can view their empresa module visibility" on public.tenant_module_visibility;
drop policy if exists "Empresa admins can manage module visibility" on public.tenant_module_visibility;

-- 2. Drop existing policies for tenant_submodule_visibility
drop policy if exists "Users can view their empresa submodule visibility" on public.tenant_submodule_visibility;
drop policy if exists "Empresa admins can manage submodule visibility" on public.tenant_submodule_visibility;

-- 3. Recreate policies for tenant_module_visibility using is_superadmin()
create policy "Users can view their empresa module visibility"
    on public.tenant_module_visibility
    for select
    to authenticated
    using (
        empresa_id in (
            select empresa_id from public.professores where id = (select auth.uid())
            union
            select c.empresa_id from public.alunos_cursos ac
            join public.cursos c on ac.curso_id = c.id
            where ac.aluno_id = (select auth.uid())
        )
        or
        public.is_superadmin()
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
        public.is_superadmin()
    )
    with check (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = tenant_module_visibility.empresa_id
            and is_admin = true
        )
        or
        public.is_superadmin()
    );

-- 4. Recreate policies for tenant_submodule_visibility using is_superadmin()
create policy "Users can view their empresa submodule visibility"
    on public.tenant_submodule_visibility
    for select
    to authenticated
    using (
        empresa_id in (
            select empresa_id from public.professores where id = (select auth.uid())
            union
            select c.empresa_id from public.alunos_cursos ac
            join public.cursos c on ac.curso_id = c.id
            where ac.aluno_id = (select auth.uid())
        )
        or
        public.is_superadmin()
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
        public.is_superadmin()
    )
    with check (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = tenant_submodule_visibility.empresa_id
            and is_admin = true
        )
        or
        public.is_superadmin()
    );
