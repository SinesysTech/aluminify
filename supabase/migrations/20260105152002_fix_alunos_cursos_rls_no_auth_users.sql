-- Migration: Fix alunos_cursos RLS policies to avoid direct auth.users access
-- Description: Remove direct access to auth.users in RLS policies to prevent permission errors
-- Author: Auto
-- Date: 2026-01-05

-- Criar função auxiliar para verificar se é superadmin (sem acessar auth.users diretamente em RLS)
-- Esta função usa SECURITY DEFINER para ter permissão de acessar auth.users
create or replace function public.is_superadmin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    return exists (
        select 1
        from auth.users
        where id = (select auth.uid())
        and raw_user_meta_data->>'role' = 'superadmin'
    );
end;
$$;

comment on function public.is_superadmin() is 'Verifica se o usuário logado é superadmin. Usa SECURITY DEFINER para acessar auth.users.';

-- Remover políticas antigas de alunos_cursos
drop policy if exists "Alunos veem suas matrículas e admins veem matrículas de sua empresa" on public.alunos_cursos;
drop policy if exists "Apenas admins podem criar matrículas" on public.alunos_cursos;
drop policy if exists "Apenas admins podem deletar matrículas" on public.alunos_cursos;

-- Recriar política SELECT sem acesso direto a auth.users
create policy "Alunos veem suas matrículas e admins veem matrículas de sua empresa"
    on public.alunos_cursos
    for select
    to authenticated
    using (
        -- Aluno vê suas próprias matrículas
        aluno_id = (select auth.uid())
        or
        -- Admin da empresa vê matrículas em cursos da empresa
        (
            public.is_empresa_admin()
            and exists (
                select 1
                from public.cursos
                where cursos.id = alunos_cursos.curso_id
                and cursos.empresa_id = public.get_user_empresa_id()
            )
        )
        or
        -- Superadmin (usando função auxiliar)
        public.is_superadmin()
    );

-- Recriar política INSERT sem acesso direto a auth.users
create policy "Apenas admins podem criar matrículas"
    on public.alunos_cursos
    for insert
    to authenticated
    with check (
        -- Admin da empresa do curso
        (
            public.is_empresa_admin()
            and exists (
                select 1
                from public.cursos
                where cursos.id = alunos_cursos.curso_id
                and cursos.empresa_id = public.get_user_empresa_id()
            )
        )
        or
        -- Superadmin (usando função auxiliar)
        public.is_superadmin()
    );

-- Recriar política DELETE sem acesso direto a auth.users
create policy "Apenas admins podem deletar matrículas"
    on public.alunos_cursos
    for delete
    to authenticated
    using (
        -- Admin da empresa do curso
        (
            public.is_empresa_admin()
            and exists (
                select 1
                from public.cursos
                where cursos.id = alunos_cursos.curso_id
                and cursos.empresa_id = public.get_user_empresa_id()
            )
        )
        or
        -- Superadmin (usando função auxiliar)
        public.is_superadmin()
    );


