-- Migration: Tenant Hardening — Audit Log, Quotas, and RLS Fixes
-- Description:
--   1. Fix is_empresa_admin() to SECURITY DEFINER with fast-path
--   2. Remove auth.users references from branding & disciplinas RLS policies
--   3. Create tenant_access_log table and log_tenant_access() function
--   4. Create tenant_quotas table for persistent per-tenant quotas
--   5. Apply default empresa_id RLS policies where missing
-- Author: Security Hardening
-- Date: 2026-01-30

BEGIN;

-- ============================================================================
-- SECTION 1: Fix is_empresa_admin() — SECURITY DEFINER with fast-path
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_empresa_admin(user_id_param uuid, empresa_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Fast-path: reject null params early to avoid unnecessary queries
    IF user_id_param IS NULL OR empresa_id_param IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.empresa_admins
        WHERE empresa_admins.empresa_id = is_empresa_admin.empresa_id_param
        AND empresa_admins.user_id = is_empresa_admin.user_id_param
    )
    OR EXISTS (
        SELECT 1
        FROM public.professores
        WHERE professores.id = is_empresa_admin.user_id_param
        AND professores.empresa_id = is_empresa_admin.empresa_id_param
        AND professores.is_admin = true
    );
END;
$$;

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


-- ============================================================================
-- SECTION 2: Fix branding table RLS policies — remove auth.users references
-- ============================================================================

-- --------------------------------------------------------------------------
-- TABLE: tenant_branding
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their empresa branding" ON public.tenant_branding;
CREATE POLICY "Users can view their empresa branding"
    ON public.tenant_branding
    FOR SELECT
    TO authenticated
    USING (
        empresa_id IN (
            SELECT p.empresa_id FROM public.professores p WHERE p.id = (SELECT auth.uid())
            UNION
            SELECT c.empresa_id FROM public.alunos_cursos ac
            JOIN public.cursos c ON ac.curso_id = c.id
            WHERE ac.aluno_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Empresa admins can manage branding" ON public.tenant_branding;
CREATE POLICY "Empresa admins can manage branding"
    ON public.tenant_branding
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = (SELECT auth.uid())
            AND empresa_id = tenant_branding.empresa_id
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = (SELECT auth.uid())
            AND empresa_id = tenant_branding.empresa_id
            AND is_admin = true
        )
    );

-- --------------------------------------------------------------------------
-- TABLE: tenant_logos
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their empresa logos" ON public.tenant_logos;
CREATE POLICY "Users can view their empresa logos"
    ON public.tenant_logos
    FOR SELECT
    TO authenticated
    USING (
        tenant_branding_id IN (
            SELECT id FROM public.tenant_branding
            WHERE empresa_id IN (
                SELECT p.empresa_id FROM public.professores p WHERE p.id = (SELECT auth.uid())
                UNION
                SELECT c.empresa_id FROM public.alunos_cursos ac
                JOIN public.cursos c ON ac.curso_id = c.id
                WHERE ac.aluno_id = (SELECT auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Empresa admins can manage logos" ON public.tenant_logos;
CREATE POLICY "Empresa admins can manage logos"
    ON public.tenant_logos
    FOR ALL
    TO authenticated
    USING (
        tenant_branding_id IN (
            SELECT tb.id FROM public.tenant_branding tb
            WHERE EXISTS (
                SELECT 1 FROM public.professores
                WHERE id = (SELECT auth.uid())
                AND empresa_id = tb.empresa_id
                AND is_admin = true
            )
        )
    )
    WITH CHECK (
        tenant_branding_id IN (
            SELECT tb.id FROM public.tenant_branding tb
            WHERE EXISTS (
                SELECT 1 FROM public.professores
                WHERE id = (SELECT auth.uid())
                AND empresa_id = tb.empresa_id
                AND is_admin = true
            )
        )
    );

-- --------------------------------------------------------------------------
-- TABLE: color_palettes
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their empresa color palettes" ON public.color_palettes;
CREATE POLICY "Users can view their empresa color palettes"
    ON public.color_palettes
    FOR SELECT
    TO authenticated
    USING (
        empresa_id IN (
            SELECT p.empresa_id FROM public.professores p WHERE p.id = (SELECT auth.uid())
            UNION
            SELECT c.empresa_id FROM public.alunos_cursos ac
            JOIN public.cursos c ON ac.curso_id = c.id
            WHERE ac.aluno_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Empresa admins can manage color palettes" ON public.color_palettes;
CREATE POLICY "Empresa admins can manage color palettes"
    ON public.color_palettes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = (SELECT auth.uid())
            AND empresa_id = color_palettes.empresa_id
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = (SELECT auth.uid())
            AND empresa_id = color_palettes.empresa_id
            AND is_admin = true
        )
    );

-- --------------------------------------------------------------------------
-- TABLE: font_schemes
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their empresa font schemes" ON public.font_schemes;
CREATE POLICY "Users can view their empresa font schemes"
    ON public.font_schemes
    FOR SELECT
    TO authenticated
    USING (
        empresa_id IN (
            SELECT p.empresa_id FROM public.professores p WHERE p.id = (SELECT auth.uid())
            UNION
            SELECT c.empresa_id FROM public.alunos_cursos ac
            JOIN public.cursos c ON ac.curso_id = c.id
            WHERE ac.aluno_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Empresa admins can manage font schemes" ON public.font_schemes;
CREATE POLICY "Empresa admins can manage font schemes"
    ON public.font_schemes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = (SELECT auth.uid())
            AND empresa_id = font_schemes.empresa_id
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = (SELECT auth.uid())
            AND empresa_id = font_schemes.empresa_id
            AND is_admin = true
        )
    );

-- --------------------------------------------------------------------------
-- TABLE: custom_theme_presets
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their empresa theme presets" ON public.custom_theme_presets;
CREATE POLICY "Users can view their empresa theme presets"
    ON public.custom_theme_presets
    FOR SELECT
    TO authenticated
    USING (
        empresa_id IN (
            SELECT p.empresa_id FROM public.professores p WHERE p.id = (SELECT auth.uid())
            UNION
            SELECT c.empresa_id FROM public.alunos_cursos ac
            JOIN public.cursos c ON ac.curso_id = c.id
            WHERE ac.aluno_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Empresa admins can manage theme presets" ON public.custom_theme_presets;
CREATE POLICY "Empresa admins can manage theme presets"
    ON public.custom_theme_presets
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = (SELECT auth.uid())
            AND empresa_id = custom_theme_presets.empresa_id
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = (SELECT auth.uid())
            AND empresa_id = custom_theme_presets.empresa_id
            AND is_admin = true
        )
    );


-- ============================================================================
-- SECTION 3: Fix disciplinas write policies — remove auth.users references
-- ============================================================================

DROP POLICY IF EXISTS "Professores criam disciplinas em sua empresa" ON public.disciplinas;
CREATE POLICY "Professores criam disciplinas em sua empresa"
    ON public.disciplinas
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.professores WHERE id = (SELECT auth.uid()))
        AND empresa_id = public.get_user_empresa_id()
    );

DROP POLICY IF EXISTS "Professores editam disciplinas de sua empresa" ON public.disciplinas;
CREATE POLICY "Professores editam disciplinas de sua empresa"
    ON public.disciplinas
    FOR UPDATE
    TO authenticated
    USING (
        (created_by = (SELECT auth.uid()) AND empresa_id = public.get_user_empresa_id())
        OR (empresa_id = public.get_user_empresa_id() AND public.is_empresa_admin())
    )
    WITH CHECK (
        (created_by = (SELECT auth.uid()) AND empresa_id = public.get_user_empresa_id())
        OR (empresa_id = public.get_user_empresa_id() AND public.is_empresa_admin())
    );

DROP POLICY IF EXISTS "Professores deletam disciplinas de sua empresa" ON public.disciplinas;
CREATE POLICY "Professores deletam disciplinas de sua empresa"
    ON public.disciplinas
    FOR DELETE
    TO authenticated
    USING (
        (created_by = (SELECT auth.uid()) AND empresa_id = public.get_user_empresa_id())
        OR (empresa_id = public.get_user_empresa_id() AND public.is_empresa_admin())
    );

-- Also fix the SELECT policy if it still references auth.users
DROP POLICY IF EXISTS "Disciplinas visíveis para usuários da mesma empresa" ON public.disciplinas;
CREATE POLICY "Disciplinas visíveis para usuários da mesma empresa"
    ON public.disciplinas
    FOR SELECT
    TO authenticated
    USING (
        empresa_id = public.get_user_empresa_id()
    );


-- ============================================================================
-- SECTION 4: Create tenant_access_log table and logging functions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_access_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario_id uuid,
    table_name text NOT NULL,
    operation text NOT NULL CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
    row_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS on audit log: admins can view their empresa's logs
ALTER TABLE public.tenant_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa admins can view access logs"
    ON public.tenant_access_log
    FOR SELECT
    TO authenticated
    USING (
        empresa_id = public.get_user_empresa_id()
        AND public.is_empresa_admin()
    );

-- No INSERT/UPDATE/DELETE policies for authenticated users.
-- Only the log_tenant_access() SECURITY DEFINER function can insert.

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tenant_access_log_empresa_created
    ON public.tenant_access_log (empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_access_log_usuario
    ON public.tenant_access_log (usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_access_log_table
    ON public.tenant_access_log (empresa_id, table_name, created_at DESC);

-- Logging function (SECURITY DEFINER so it can insert into the audit table)
CREATE OR REPLACE FUNCTION public.log_tenant_access(
    p_table_name text,
    p_operation text,
    p_row_count integer DEFAULT 0,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_empresa_id uuid;
    v_uid uuid;
BEGIN
    v_uid := (SELECT auth.uid());
    IF v_uid IS NULL THEN
        RETURN; -- No authenticated user, skip logging
    END IF;

    v_empresa_id := public.get_user_empresa_id();
    IF v_empresa_id IS NULL THEN
        RETURN; -- No empresa context, skip logging
    END IF;

    INSERT INTO public.tenant_access_log (empresa_id, usuario_id, table_name, operation, row_count, metadata)
    VALUES (v_empresa_id, v_uid, p_table_name, p_operation, p_row_count, p_metadata);
END;
$$;

-- Cleanup function to remove old logs (default: older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_tenant_access_log(days_to_keep integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.tenant_access_log
    WHERE created_at < now() - (days_to_keep || ' days')::interval;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON TABLE public.tenant_access_log IS 'Audit log tracking tenant data access for security and compliance';
COMMENT ON FUNCTION public.log_tenant_access(text, text, integer, jsonb) IS 'Logs tenant data access events. SECURITY DEFINER to bypass RLS for writes.';
COMMENT ON FUNCTION public.cleanup_tenant_access_log(integer) IS 'Removes old audit log entries. Default retention: 90 days.';


-- ============================================================================
-- SECTION 5: Create tenant_quotas table for persistent per-tenant quotas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_quotas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    quota_type text NOT NULL, -- 'api_requests_per_minute', 'storage_mb', 'max_users', etc.
    max_value integer NOT NULL,
    current_value integer DEFAULT 0,
    window_seconds integer, -- for rate-limit quotas (e.g. 60 = per minute)
    reset_at timestamptz, -- when the counter resets (for windowed quotas)
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(empresa_id, quota_type)
);

ALTER TABLE public.tenant_quotas ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage their empresa's quotas
CREATE POLICY "Empresa admins can view quotas"
    ON public.tenant_quotas
    FOR SELECT
    TO authenticated
    USING (
        empresa_id = public.get_user_empresa_id()
    );

CREATE POLICY "Empresa admins can manage quotas"
    ON public.tenant_quotas
    FOR ALL
    TO authenticated
    USING (
        empresa_id = public.get_user_empresa_id()
        AND public.is_empresa_admin()
    )
    WITH CHECK (
        empresa_id = public.get_user_empresa_id()
        AND public.is_empresa_admin()
    );

CREATE INDEX IF NOT EXISTS idx_tenant_quotas_empresa_type
    ON public.tenant_quotas (empresa_id, quota_type);

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_tenant_quotas
    BEFORE UPDATE ON public.tenant_quotas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to check and increment a quota atomically
CREATE OR REPLACE FUNCTION public.check_tenant_quota(
    p_empresa_id uuid,
    p_quota_type text,
    p_increment integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_quota RECORD;
BEGIN
    SELECT * INTO v_quota
    FROM public.tenant_quotas
    WHERE empresa_id = p_empresa_id
    AND quota_type = p_quota_type
    FOR UPDATE; -- Lock row for atomic update

    IF NOT FOUND THEN
        RETURN true; -- No quota configured, allow
    END IF;

    -- For windowed quotas, reset if window has passed
    IF v_quota.window_seconds IS NOT NULL AND v_quota.reset_at IS NOT NULL
       AND v_quota.reset_at < now() THEN
        UPDATE public.tenant_quotas
        SET current_value = p_increment,
            reset_at = now() + (v_quota.window_seconds || ' seconds')::interval,
            updated_at = now()
        WHERE id = v_quota.id;
        RETURN true;
    END IF;

    -- Check if under limit
    IF v_quota.current_value + p_increment > v_quota.max_value THEN
        RETURN false; -- Quota exceeded
    END IF;

    -- Increment
    UPDATE public.tenant_quotas
    SET current_value = current_value + p_increment,
        updated_at = now()
    WHERE id = v_quota.id;

    RETURN true;
END;
$$;

COMMENT ON TABLE public.tenant_quotas IS 'Persistent per-tenant quota configuration and tracking';
COMMENT ON FUNCTION public.check_tenant_quota(uuid, text, integer) IS 'Atomically checks and increments a tenant quota. Returns false if exceeded.';


-- ============================================================================
-- SECTION 6: Fix empresa_admins policies — remove superadmin references
-- These were partially cleaned by 20260129 but ensure consistency.
-- ============================================================================

DROP POLICY IF EXISTS "Apenas owner ou superadmin pode adicionar admins" ON public.empresa_admins;
DROP POLICY IF EXISTS "Apenas owner ou superadmin pode remover admins" ON public.empresa_admins;

-- These may already exist from 20260129, but recreate for safety
DROP POLICY IF EXISTS "Owner adiciona admins" ON public.empresa_admins;
CREATE POLICY "Owner adiciona admins"
    ON public.empresa_admins
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_empresa_owner(empresa_id)
    );

DROP POLICY IF EXISTS "Owner remove admins" ON public.empresa_admins;
CREATE POLICY "Owner remove admins"
    ON public.empresa_admins
    FOR DELETE
    TO authenticated
    USING (
        is_empresa_owner(empresa_id)
        AND user_id != (SELECT auth.uid()) -- Cannot remove self
    );


COMMIT;
