-- Migration: Fix get_user_empresa_id function
-- Description: Removes dependency on deprecated public.professores table
-- Date: 2026-02-02

CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    empresa_id_result uuid;
BEGIN
    SELECT empresa_id
    INTO empresa_id_result
    FROM public.usuarios
    WHERE id = (SELECT auth.uid())
    AND deleted_at IS NULL
    LIMIT 1;

    RETURN empresa_id_result;
END;
$$;

COMMENT ON FUNCTION public.get_user_empresa_id() IS 'Retorna empresa_id do usuário logado. Busca na tabela usuarios. (Fixed to remove legacy professores table dependency)';
