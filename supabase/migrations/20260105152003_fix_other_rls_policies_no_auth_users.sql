-- Migration: Fix other critical RLS policies to avoid direct auth.users access
-- Description: Update most commonly used RLS policies to use is_superadmin() function
-- Author: Auto
-- Date: 2026-01-05

-- Atualizar política de professores SELECT
drop policy if exists "Professores veem apenas professores da mesma empresa" on public.professores;
create policy "Professores veem apenas professores da mesma empresa"
    on public.professores
    for select
    to authenticated
    using (
        -- Professor vê sua própria empresa
        empresa_id = public.get_user_empresa_id()
        or
        -- Superadmin vê todos (usando função auxiliar)
        public.is_superadmin()
    );

-- Atualizar política de professores INSERT
drop policy if exists "Admins podem criar professores em sua empresa" on public.professores;
create policy "Admins podem criar professores em sua empresa"
    on public.professores
    for insert
    to authenticated
    with check (
        -- Admin da empresa
        (
            empresa_id = public.get_user_empresa_id()
            and public.is_empresa_admin()
        )
        or
        -- Superadmin (usando função auxiliar)
        public.is_superadmin()
    );

-- Atualizar política de cursos INSERT
drop policy if exists "Admins podem criar cursos em sua empresa" on public.cursos;
create policy "Admins podem criar cursos em sua empresa"
    on public.cursos
    for insert
    to authenticated
    with check (
        -- Admin da empresa
        (
            empresa_id = public.get_user_empresa_id()
            and public.is_empresa_admin()
        )
        or
        -- Superadmin (usando função auxiliar)
        public.is_superadmin()
    );

-- Atualizar política de cursos UPDATE
drop policy if exists "Criador ou admin pode atualizar cursos" on public.cursos;
create policy "Criador ou admin pode atualizar cursos"
    on public.cursos
    for update
    to authenticated
    using (
        (
            created_by = (select auth.uid())
            and empresa_id = public.get_user_empresa_id()
        )
        or
        (
            empresa_id = public.get_user_empresa_id()
            and public.is_empresa_admin()
        )
        or
        -- Superadmin (usando função auxiliar)
        public.is_superadmin()
    )
    with check (
        (
            created_by = (select auth.uid())
            and empresa_id = public.get_user_empresa_id()
        )
        or
        (
            empresa_id = public.get_user_empresa_id()
            and public.is_empresa_admin()
        )
        or
        -- Superadmin (usando função auxiliar)
        public.is_superadmin()
    );

-- Atualizar política de cursos DELETE
drop policy if exists "Criador ou admin pode deletar cursos" on public.cursos;
create policy "Criador ou admin pode deletar cursos"
    on public.cursos
    for delete
    to authenticated
    using (
        (
            created_by = (select auth.uid())
            and empresa_id = public.get_user_empresa_id()
        )
        or
        (
            empresa_id = public.get_user_empresa_id()
            and public.is_empresa_admin()
        )
        or
        -- Superadmin (usando função auxiliar)
        public.is_superadmin()
    );

-- Atualizar política de alunos SELECT (para admins)
drop policy if exists "Admins podem ver alunos de sua empresa" on public.alunos;
create policy "Admins podem ver alunos de sua empresa"
    on public.alunos
    for select
    to authenticated
    using (
        -- Aluno vê seus próprios dados (policy existente já cobre)
        id = (select auth.uid())
        or
        -- Admin da empresa pode ver alunos matriculados em cursos da empresa
        (
            public.is_empresa_admin()
            and exists (
                select 1
                from public.alunos_cursos
                inner join public.cursos on cursos.id = alunos_cursos.curso_id
                where alunos_cursos.aluno_id = alunos.id
                and cursos.empresa_id = public.get_user_empresa_id()
            )
        )
        or
        -- Superadmin (usando função auxiliar)
        public.is_superadmin()
    );


