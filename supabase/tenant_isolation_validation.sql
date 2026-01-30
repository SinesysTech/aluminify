-- ============================================================================
-- TENANT ISOLATION VALIDATION QUERIES
-- ============================================================================
-- These queries are NOT a migration. They are diagnostic queries to be run
-- manually to validate tenant isolation, RLS policies, and data integrity.
-- Run with: psql -f supabase/tenant_isolation_validation.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. INVENTORY: All tables with/without empresa_id
-- ---------------------------------------------------------------------------
SELECT
    t.tablename                                          AS table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = t.tablename
          AND c.column_name = 'empresa_id'
    )                                                    AS has_empresa_id,
    t.rowsecurity                                        AS rls_enabled,
    (SELECT count(*)
     FROM pg_policies p
     WHERE p.tablename = t.tablename
       AND p.schemaname = 'public')                      AS policy_count,
    (SELECT count(*)
     FROM pg_indexes i
     WHERE i.tablename = t.tablename
       AND i.schemaname = 'public'
       AND i.indexdef ILIKE '%empresa_id%')               AS empresa_id_index_count
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- ---------------------------------------------------------------------------
-- 2. All active RLS policies per table
-- ---------------------------------------------------------------------------
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles::text,
    cmd,
    qual::text   AS using_clause,
    with_check::text AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ---------------------------------------------------------------------------
-- 3. Functions that access auth.users directly (potential permission issues)
-- ---------------------------------------------------------------------------
SELECT
    p.proname      AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_context,
    p.proconfig    AS config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%auth.users%'
ORDER BY p.proname;

-- ---------------------------------------------------------------------------
-- 4. Indexes on empresa_id columns
-- ---------------------------------------------------------------------------
SELECT
    i.tablename,
    i.indexname,
    i.indexdef
FROM pg_indexes i
WHERE i.schemaname = 'public'
  AND i.indexdef ILIKE '%empresa_id%'
ORDER BY i.tablename, i.indexname;

-- ---------------------------------------------------------------------------
-- 5. Policies with USING(true) — potential data leaks
-- ---------------------------------------------------------------------------
SELECT
    schemaname,
    tablename,
    policyname,
    roles::text,
    cmd,
    qual::text AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND qual::text = 'true'
ORDER BY tablename;

-- ---------------------------------------------------------------------------
-- 6. Helper functions and their security contexts
-- ---------------------------------------------------------------------------
SELECT
    p.proname      AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    CASE p.provolatile
        WHEN 'v' THEN 'VOLATILE'
        WHEN 's' THEN 'STABLE'
        WHEN 'i' THEN 'IMMUTABLE'
    END AS volatility,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_context,
    p.proconfig AS config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%empresa%'
       OR p.proname LIKE '%tenant%'
       OR p.proname LIKE '%user%'
       OR p.proname LIKE '%admin%'
       OR p.proname LIKE '%aluno%')
ORDER BY p.proname;

-- ---------------------------------------------------------------------------
-- 7. Tables without empresa_id that have user-reference columns
-- ---------------------------------------------------------------------------
SELECT
    t.tablename,
    (SELECT string_agg(c.column_name, ', ' ORDER BY c.ordinal_position)
     FROM information_schema.columns c
     WHERE c.table_schema = 'public'
       AND c.table_name = t.tablename
       AND c.column_name IN ('usuario_id','aluno_id','professor_id','user_id','created_by')
    ) AS user_ref_columns
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = t.tablename
        AND c.column_name = 'empresa_id'
  )
ORDER BY t.tablename;

-- ---------------------------------------------------------------------------
-- 8. Orphaned records without valid empresa_id
-- ---------------------------------------------------------------------------
SELECT 'cursos' AS table_name, count(*) AS orphan_count
FROM public.cursos
WHERE empresa_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = cursos.empresa_id)
UNION ALL
SELECT 'usuarios', count(*)
FROM public.usuarios
WHERE empresa_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = usuarios.empresa_id)
UNION ALL
SELECT 'disciplinas', count(*)
FROM public.disciplinas
WHERE empresa_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = disciplinas.empresa_id);

-- ---------------------------------------------------------------------------
-- 9. usuarios_empresas consistency check
-- ---------------------------------------------------------------------------
SELECT
    u.id AS usuario_id,
    u.empresa_id AS usuarios_empresa_id,
    ue.empresa_id AS ue_empresa_id,
    ue.papel_base,
    ue.is_admin
FROM public.usuarios u
LEFT JOIN public.usuarios_empresas ue
    ON ue.usuario_id = u.id AND ue.ativo = true AND ue.deleted_at IS NULL
WHERE u.deleted_at IS NULL
  AND u.ativo = true
  AND (u.empresa_id IS NOT NULL AND ue.empresa_id IS NULL)
ORDER BY u.id;
