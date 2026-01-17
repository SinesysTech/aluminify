-- Migration: Secure Alunos RLS Policies
-- Description: Replace outdated Superadmin policy and enforce strict Admin visibility
-- Author: Antigravity
-- Date: 2026-01-17

-- 1. Drop potentially problematic/outdated policies
drop policy if exists "Superadmin vê todos os alunos" on public.alunos;
drop policy if exists "Superadmin gerencia alunos" on public.alunos;
drop policy if exists "Admins podem ver alunos de sua empresa" on public.alunos;

-- 2. Re-create "Superadmin vê todos os alunos" using the secure helper function
create policy "Superadmin vê todos os alunos"
    on public.alunos
    for select
    to authenticated
    using (
        public.is_superadmin()
    );

create policy "Superadmin gerencia alunos"
    on public.alunos
    for all
    to authenticated
    using (
        public.is_superadmin()
    );

-- 3. Re-create "Admins podem ver alunos de sua empresa" with robust logic
-- Uses SECURITY DEFINER function for superadmin check (via is_superadmin)
-- Uses SECURITY DEFINER function for empresa_id (if corrected) or standard logic
create policy "Admins podem ver alunos de sua empresa"
    on public.alunos
    for select
    to authenticated
    using (
        -- Aluno vê seus próprios dados (já coberto por policy de perfil, mas redundância ok se OR)
        id = (select auth.uid())
        or
        -- Admin da empresa vê alunos matriculados em cursos da empresa
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
        -- Superadmin (redundância explícita)
        public.is_superadmin()
    );
