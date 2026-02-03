-- =============================================================================
-- RLS Refactoring Validation Script
-- Purpose: Validates the RLS policy consolidation was successful by checking:
--   1. Policy counts per table (should be reduced)
--   2. Multiple permissive policies per operation (should be minimal)
--   3. Helper functions are SECURITY DEFINER
--   4. Tenant isolation integrity
--   5. Index protection status
-- =============================================================================

-- ===================== 1. Policy Count Summary =====================
-- Shows total policies per table. After refactoring, high-count tables
-- should have significantly fewer policies.

SELECT '=== 1. POLICY COUNT PER TABLE ===' AS section;

SELECT
    tablename,
    count(*) AS policy_count,
    string_agg(DISTINCT cmd, ', ' ORDER BY cmd) AS operations
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;


-- ===================== 2. Multiple Permissive Policies Per Operation =====================
-- This is the key metric. Multiple permissive policies on the same table+operation
-- cause the "multiple_permissive_policies" advisor warning.
-- After refactoring, this should return very few rows.

SELECT '=== 2. MULTIPLE PERMISSIVE POLICIES PER OPERATION ===' AS section;

SELECT
    tablename,
    cmd,
    count(*) AS policy_count,
    string_agg(policyname, E'\n  ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
GROUP BY tablename, cmd
HAVING count(*) > 1
ORDER BY policy_count DESC, tablename, cmd;


-- ===================== 3. Helper Functions Security Context =====================
-- All RLS helper functions MUST be SECURITY DEFINER to avoid RLS recursion.
-- This query flags any that are SECURITY INVOKER.

SELECT '=== 3. HELPER FUNCTIONS SECURITY CONTEXT ===' AS section;

SELECT
    proname AS function_name,
    CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_context,
    CASE provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END AS volatility,
    pg_get_function_arguments(oid) AS arguments,
    CASE WHEN NOT prosecdef THEN '⚠️ SHOULD BE SECURITY DEFINER' ELSE '✅ OK' END AS status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_user_context', 'get_user_empresa_id', 'get_auth_user_empresa_id',
    'is_empresa_admin', 'is_professor', 'is_empresa_owner', 'is_aluno',
    'user_belongs_to_empresa', 'aluno_matriculado_empresa',
    'is_professor_da_disciplina', 'professor_tem_acesso_frente',
    'professor_tem_acesso_modulo', 'is_teaching_user',
    'get_aluno_empresa_id', 'get_aluno_empresas', 'aluno_em_turma'
  )
ORDER BY proname;


-- ===================== 4. Tables with RLS Disabled =====================
-- All public tables with user data should have RLS enabled.

SELECT '=== 4. TABLES WITH RLS DISABLED ===' AS section;

SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY c.relname;


-- ===================== 5. Policies Using USING(true) =====================
-- Potential data leaks: policies that allow unrestricted access.

SELECT '=== 5. POLICIES WITH USING(true) - POTENTIAL LEAKS ===' AS section;

SELECT tablename, policyname, cmd, qual AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND qual = 'true';


-- ===================== 6. Consolidated Tables Verification =====================
-- Verify that refactored tables have expected policy counts.

SELECT '=== 6. REFACTORED TABLES VERIFICATION ===' AS section;

SELECT
    tablename,
    count(*) AS actual_policies,
    CASE tablename
        WHEN 'usuarios' THEN 4
        WHEN 'materiais_curso' THEN 4
        WHEN 'agendamento_bloqueios' THEN 4
        WHEN 'agendamento_recorrencia' THEN 4
        WHEN 'agendamentos' THEN 3
        WHEN 'api_keys' THEN 4
        WHEN 'agendamento_configuracoes' THEN 2
        WHEN 'progresso_atividades' THEN 2
        WHEN 'sessoes_estudo' THEN 2
        WHEN 'aulas_concluidas' THEN 2
        WHEN 'agendamento_disponibilidade' THEN 2
        WHEN 'agendamento_notificacoes' THEN 2
        WHEN 'papeis' THEN 4
        WHEN 'matriculas' THEN 4
        ELSE NULL
    END AS expected_policies,
    CASE
        WHEN count(*) = CASE tablename
            WHEN 'usuarios' THEN 4
            WHEN 'materiais_curso' THEN 4
            WHEN 'agendamento_bloqueios' THEN 4
            WHEN 'agendamento_recorrencia' THEN 4
            WHEN 'agendamentos' THEN 3
            WHEN 'api_keys' THEN 4
            WHEN 'agendamento_configuracoes' THEN 2
            WHEN 'progresso_atividades' THEN 2
            WHEN 'sessoes_estudo' THEN 2
            WHEN 'aulas_concluidas' THEN 2
            WHEN 'agendamento_disponibilidade' THEN 2
            WHEN 'agendamento_notificacoes' THEN 2
            WHEN 'papeis' THEN 4
            WHEN 'matriculas' THEN 4
            ELSE NULL
        END THEN '✅ PASS'
        ELSE '❌ MISMATCH'
    END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'usuarios', 'materiais_curso', 'agendamento_bloqueios',
    'agendamento_recorrencia', 'agendamentos', 'api_keys',
    'agendamento_configuracoes', 'progresso_atividades', 'sessoes_estudo',
    'aulas_concluidas', 'agendamento_disponibilidade', 'agendamento_notificacoes',
    'papeis', 'matriculas'
  )
GROUP BY tablename
ORDER BY tablename;


-- ===================== 7. Index Protection Status =====================
-- Verify all critical indexes have protective comments.

SELECT '=== 7. INDEX PROTECTION STATUS ===' AS section;

SELECT
    s.indexrelname AS index_name,
    s.relname AS table_name,
    s.idx_scan,
    CASE
        WHEN obj_description(s.indexrelid, 'pg_class') IS NOT NULL THEN '✅ Protected'
        WHEN s.idx_scan = 0 THEN '⚠️ No comment, zero scans'
        ELSE '✅ Has scans'
    END AS protection_status,
    COALESCE(
        substring(obj_description(s.indexrelid, 'pg_class') from 1 for 60),
        '(no comment)'
    ) AS comment_preview
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.schemaname = 'public'
  AND NOT i.indisprimary
  AND NOT i.indisunique
  AND s.idx_scan = 0
ORDER BY s.relname, s.indexrelname;


-- ===================== 8. Overall Summary =====================

SELECT '=== 8. OVERALL SUMMARY ===' AS section;

SELECT
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') AS total_policies,
    (SELECT count(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') AS tables_with_policies,
    (SELECT count(*)
     FROM (
        SELECT tablename, cmd
        FROM pg_policies
        WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
        GROUP BY tablename, cmd
        HAVING count(*) > 1
     ) sub
    ) AS duplicate_permissive_count,
    (SELECT count(*)
     FROM pg_proc
     WHERE pronamespace = 'public'::regnamespace
       AND prosecdef = true
       AND proname LIKE ANY(ARRAY['is_%', 'get_%', 'user_%', 'aluno_%', 'professor_%'])
    ) AS security_definer_helpers;
