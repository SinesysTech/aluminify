-- Migration: Fix aluno_matriculado_empresa to use usuario_id (unified model)
-- Description: A tabela alunos_cursos usa usuario_id no modelo unificado.
--              A função aluno_matriculado_empresa ainda usava apenas aluno_id,
--              causando que alunos não vissem cursos/conteúdo (ex: "Conteúdo ainda
--              não disponível" no cronograma para Terra Negra). Corrige para
--              aceitar usuario_id OU aluno_id (retrocompatibilidade).
-- Date: 2026-01-31

CREATE OR REPLACE FUNCTION public.aluno_matriculado_empresa(empresa_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    -- Verifica se o usuário logado está matriculado em algum curso da empresa.
    -- Modelo unificado: alunos_cursos.usuario_id = auth.uid()
    RETURN EXISTS (
        SELECT 1
        FROM public.alunos_cursos ac
        INNER JOIN public.cursos c ON c.id = ac.curso_id
        WHERE ac.usuario_id = (SELECT auth.uid())
        AND c.empresa_id = aluno_matriculado_empresa.empresa_id_param
    );
END;
$$;

COMMENT ON FUNCTION public.aluno_matriculado_empresa(uuid) IS 'Verifica se o usuário logado está matriculado em algum curso da empresa (usa usuario_id no modelo unificado).';
