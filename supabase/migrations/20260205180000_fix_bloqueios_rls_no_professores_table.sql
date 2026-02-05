-- Migration: Fix bloqueios RLS - Remove dependency on non-existent 'professores' table
-- Description: Atualiza funções e políticas RLS para usar usuarios_empresas em vez de professores
-- Author: Auto-generated
-- Date: 2026-02-05
--
-- PROBLEMA:
-- A tabela 'professores' não existe, mas get_user_empresa_id() e is_empresa_admin() 
-- tentam consultar essa tabela, causando falhas silenciosas nas políticas RLS.
--
-- SOLUÇÃO:
-- 1. Atualizar get_user_empresa_id() para buscar apenas em usuarios
-- 2. Atualizar is_empresa_admin() para usar usuarios_empresas e papeis
-- 3. Criar função is_empresa_gestor() para verificar gestores (admin, professor_admin, staff)
-- 4. Recriar políticas RLS de agendamento_bloqueios

-- ============================================================================
-- SEÇÃO 1: Atualizar get_user_empresa_id()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    empresa_id_result uuid;
BEGIN
    -- Buscar empresa_id do usuário na tabela usuarios
    SELECT empresa_id
    INTO empresa_id_result
    FROM public.usuarios
    WHERE id = (SELECT auth.uid())
    AND deleted_at IS NULL
    LIMIT 1;

    -- Se não encontrou em usuarios, tentar em usuarios_empresas (primeiro vínculo ativo)
    IF empresa_id_result IS NULL THEN
        SELECT ue.empresa_id
        INTO empresa_id_result
        FROM public.usuarios_empresas ue
        WHERE ue.usuario_id = (SELECT auth.uid())
        AND ue.ativo = true
        ORDER BY ue.created_at
        LIMIT 1;
    END IF;

    RETURN empresa_id_result;
END;
$$;

COMMENT ON FUNCTION public.get_user_empresa_id IS 'Retorna empresa_id do usuário logado. Busca em usuarios, depois em usuarios_empresas.';

-- ============================================================================
-- SEÇÃO 2: Atualizar is_empresa_admin() com 2 parâmetros
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_empresa_admin(user_id_param uuid, empresa_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Verificar se o usuário tem is_admin = true em usuarios_empresas
    RETURN EXISTS (
        SELECT 1
        FROM public.usuarios_empresas ue
        WHERE ue.usuario_id = user_id_param
        AND ue.empresa_id = empresa_id_param
        AND ue.ativo = true
        AND ue.is_admin = true
    );
END;
$$;

COMMENT ON FUNCTION public.is_empresa_admin(uuid, uuid) IS 'Verifica se um usuário é admin de uma empresa específica via empresa_admins ou usuarios_empresas.';

-- ============================================================================
-- SEÇÃO 3: Atualizar is_empresa_admin() sem parâmetros (usa usuário logado)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_empresa_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_uid uuid;
    user_empresa_id uuid;
BEGIN
    current_uid := (SELECT auth.uid());
    
    IF current_uid IS NULL THEN
        RETURN false;
    END IF;

    user_empresa_id := public.get_user_empresa_id();
    
    IF user_empresa_id IS NULL THEN
        RETURN false;
    END IF;

    RETURN public.is_empresa_admin(current_uid, user_empresa_id);
END;
$$;

COMMENT ON FUNCTION public.is_empresa_admin() IS 'Verifica se o usuário logado é admin de sua empresa.';

-- ============================================================================
-- SEÇÃO 4: Criar função is_empresa_gestor() para verificar gestores
-- Gestores podem gerenciar bloqueios de outros professores
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_empresa_gestor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_uid uuid;
    user_empresa_id uuid;
BEGIN
    current_uid := (SELECT auth.uid());
    
    IF current_uid IS NULL THEN
        RETURN false;
    END IF;

    user_empresa_id := public.get_user_empresa_id();
    
    IF user_empresa_id IS NULL THEN
        RETURN false;
    END IF;

    -- Verificar se tem is_admin = true OU é papel_base 'usuario' (staff)
    RETURN EXISTS (
        SELECT 1
        FROM public.usuarios_empresas ue
        WHERE ue.usuario_id = current_uid
        AND ue.empresa_id = user_empresa_id
        AND ue.ativo = true
        AND (ue.is_admin = true OR ue.papel_base = 'usuario')
    );
END;
$$;

COMMENT ON FUNCTION public.is_empresa_gestor IS 'Verifica se o usuário logado é gestor (admin, professor_admin ou staff) de sua empresa.';

-- ============================================================================
-- SEÇÃO 5: Criar função is_teaching_user() para verificar se é professor
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_teaching_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_uid uuid;
    user_empresa_id uuid;
BEGIN
    current_uid := (SELECT auth.uid());
    
    IF current_uid IS NULL THEN
        RETURN false;
    END IF;

    user_empresa_id := public.get_user_empresa_id();
    
    IF user_empresa_id IS NULL THEN
        RETURN false;
    END IF;

    -- Verificar se tem papel_base = 'professor'
    RETURN EXISTS (
        SELECT 1
        FROM public.usuarios_empresas ue
        WHERE ue.usuario_id = current_uid
        AND ue.empresa_id = user_empresa_id
        AND ue.ativo = true
        AND ue.papel_base = 'professor'
    );
END;
$$;

COMMENT ON FUNCTION public.is_teaching_user IS 'Verifica se o usuário logado tem papel de ensino (professor, professor_admin, monitor).';

-- ============================================================================
-- SEÇÃO 6: Recriar políticas RLS de agendamento_bloqueios
-- ============================================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Professores veem bloqueios relevantes" ON public.agendamento_bloqueios;
DROP POLICY IF EXISTS "Professores podem criar bloqueios próprios" ON public.agendamento_bloqueios;
DROP POLICY IF EXISTS "Admins podem criar bloqueios da empresa" ON public.agendamento_bloqueios;
DROP POLICY IF EXISTS "Professores podem atualizar bloqueios próprios" ON public.agendamento_bloqueios;
DROP POLICY IF EXISTS "Admins podem atualizar bloqueios da empresa" ON public.agendamento_bloqueios;
DROP POLICY IF EXISTS "Professores podem deletar bloqueios próprios" ON public.agendamento_bloqueios;
DROP POLICY IF EXISTS "Admins podem deletar bloqueios da empresa" ON public.agendamento_bloqueios;
DROP POLICY IF EXISTS "Alunos podem ver bloqueios para agendamento" ON public.agendamento_bloqueios;

-- SELECT: Professores/gestores veem bloqueios da empresa
CREATE POLICY "Usuarios veem bloqueios da empresa"
    ON public.agendamento_bloqueios
    FOR SELECT
    TO authenticated
    USING (
        empresa_id = public.get_user_empresa_id()
    );

-- SELECT: Alunos podem ver bloqueios para validação de agendamentos
CREATE POLICY "Alunos podem ver bloqueios para agendamento"
    ON public.agendamento_bloqueios
    FOR SELECT
    TO authenticated
    USING (
        empresa_id IN (
            SELECT DISTINCT c.empresa_id
            FROM public.alunos_cursos ac
            INNER JOIN public.cursos c ON c.id = ac.curso_id
            WHERE ac.usuario_id = (SELECT auth.uid())
        )
    );

-- INSERT: Professores podem criar bloqueios próprios
CREATE POLICY "Professores podem criar bloqueios proprios"
    ON public.agendamento_bloqueios
    FOR INSERT
    TO authenticated
    WITH CHECK (
        empresa_id = public.get_user_empresa_id()
        AND public.is_teaching_user()
        AND professor_id = (SELECT auth.uid())
        AND criado_por = (SELECT auth.uid())
    );

-- INSERT: Gestores podem criar bloqueios para qualquer professor ou empresa
CREATE POLICY "Gestores podem criar bloqueios"
    ON public.agendamento_bloqueios
    FOR INSERT
    TO authenticated
    WITH CHECK (
        empresa_id = public.get_user_empresa_id()
        AND public.is_empresa_gestor()
        AND criado_por = (SELECT auth.uid())
        -- professor_id pode ser null (bloqueio da empresa) ou qualquer professor da empresa
        AND (
            professor_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.usuarios u
                WHERE u.id = agendamento_bloqueios.professor_id
                AND u.empresa_id = agendamento_bloqueios.empresa_id
                AND u.deleted_at IS NULL
            )
            OR EXISTS (
                SELECT 1 FROM public.usuarios_empresas ue
                WHERE ue.usuario_id = agendamento_bloqueios.professor_id
                AND ue.empresa_id = agendamento_bloqueios.empresa_id
                AND ue.ativo = true
            )
        )
    );

-- UPDATE: Professores podem atualizar seus próprios bloqueios
CREATE POLICY "Professores podem atualizar bloqueios proprios"
    ON public.agendamento_bloqueios
    FOR UPDATE
    TO authenticated
    USING (
        empresa_id = public.get_user_empresa_id()
        AND professor_id = (SELECT auth.uid())
    )
    WITH CHECK (
        empresa_id = public.get_user_empresa_id()
        AND professor_id = (SELECT auth.uid())
    );

-- UPDATE: Gestores podem atualizar qualquer bloqueio da empresa
CREATE POLICY "Gestores podem atualizar bloqueios"
    ON public.agendamento_bloqueios
    FOR UPDATE
    TO authenticated
    USING (
        empresa_id = public.get_user_empresa_id()
        AND public.is_empresa_gestor()
    )
    WITH CHECK (
        empresa_id = public.get_user_empresa_id()
        AND public.is_empresa_gestor()
    );

-- DELETE: Professores podem deletar seus próprios bloqueios
CREATE POLICY "Professores podem deletar bloqueios proprios"
    ON public.agendamento_bloqueios
    FOR DELETE
    TO authenticated
    USING (
        empresa_id = public.get_user_empresa_id()
        AND professor_id = (SELECT auth.uid())
    );

-- DELETE: Gestores podem deletar qualquer bloqueio da empresa
CREATE POLICY "Gestores podem deletar bloqueios"
    ON public.agendamento_bloqueios
    FOR DELETE
    TO authenticated
    USING (
        empresa_id = public.get_user_empresa_id()
        AND public.is_empresa_gestor()
    );

-- ============================================================================
-- SEÇÃO 7: Verificação
-- ============================================================================

-- Para verificar se as funções foram criadas corretamente:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('get_user_empresa_id', 'is_empresa_admin', 'is_empresa_gestor', 'is_teaching_user');

-- Para verificar as políticas:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'agendamento_bloqueios';
