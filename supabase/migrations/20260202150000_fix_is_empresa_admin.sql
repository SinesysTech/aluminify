-- Migration: Fix is_empresa_admin function
-- Description: Removes dependency on deprecated public.professores table
-- Date: 2026-02-02

CREATE OR REPLACE FUNCTION public.is_empresa_admin(user_id_param uuid, empresa_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Fast-path: reject null params
    if user_id_param is null or empresa_id_param is null then
        return false;
    end if;

    -- Check only public.empresa_admins table
    -- Removed legacy check on public.professores
    RETURN EXISTS (
        SELECT 1 
        FROM public.empresa_admins 
        WHERE empresa_id = empresa_id_param 
        AND user_id = user_id_param
    );
END;
$$;

-- Also update the no-arg version to be safe, though it just calls the above
CREATE OR REPLACE FUNCTION public.is_empresa_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_empresa_id uuid;
    current_uid uuid;
BEGIN
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
END;
$$;
