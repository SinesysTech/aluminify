-- Migration: Create empresa context functions
-- Description: Funções auxiliares para facilitar RLS policies e contexto de empresa
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Função get_user_empresa_id() já foi criada na migration anterior
-- Esta migration adiciona funções complementares

-- 2. Criar função para verificar se usuário pertence à empresa
create or replace function public.user_belongs_to_empresa(empresa_id_param uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
    -- Verifica se o usuário logado pertence à empresa
    return exists (
        select 1
        from public.professores
        where id = (select auth.uid())
        and empresa_id = user_belongs_to_empresa.empresa_id_param
    )
    or exists (
        -- Superadmin pode acessar qualquer empresa
        select 1
        from auth.users
        where id = (select auth.uid())
        and raw_user_meta_data->>'role' = 'superadmin'
    );
end;
$$;

-- 3. Criar função para verificar se aluno está matriculado em curso da empresa
create or replace function public.aluno_matriculado_empresa(empresa_id_param uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
    -- Verifica se o aluno logado está matriculado em algum curso da empresa
    return exists (
        select 1
        from public.alunos_cursos
        inner join public.cursos on cursos.id = alunos_cursos.curso_id
        where alunos_cursos.aluno_id = (select auth.uid())
        and cursos.empresa_id = aluno_matriculado_empresa.empresa_id_param
    );
end;
$$;

-- 4. Criar função para obter empresas do aluno (via matrículas)
create or replace function public.get_aluno_empresas()
returns table(empresa_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
begin
    return query
    select distinct cursos.empresa_id
    from public.alunos_cursos
    inner join public.cursos on cursos.id = alunos_cursos.curso_id
    where alunos_cursos.aluno_id = (select auth.uid())
    and cursos.empresa_id is not null;
end;
$$;

-- 5. Adicionar comentários nas funções
comment on function public.user_belongs_to_empresa(uuid) is 'Verifica se o usuário logado pertence à empresa especificada. Superadmin sempre retorna true.';
comment on function public.aluno_matriculado_empresa(uuid) is 'Verifica se o aluno logado está matriculado em algum curso da empresa especificada.';
comment on function public.get_aluno_empresas() is 'Retorna lista de empresas (via matrículas em cursos) do aluno logado.';

