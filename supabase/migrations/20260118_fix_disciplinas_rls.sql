-- Migration: Fix RLS policies for disciplinas and cursos_disciplinas
-- Description: Ensures public read access for disciplines and course-discipline relationships
--             to prevent "permission denied" errors when fetching catalog data.
-- Date: 2026-01-18

-- 1. Policies for 'disciplinas'
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Catálogo de Disciplinas é Público" ON public.disciplinas;
DROP POLICY IF EXISTS "Disciplinas são visíveis para todos" ON public.disciplinas;
DROP POLICY IF EXISTS "Professores podem criar disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Professores podem atualizar disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Professores podem deletar disciplinas" ON public.disciplinas;

-- Policy: SELECT (Public)
CREATE POLICY "Disciplinas são visíveis para todos"
    ON public.disciplinas
    FOR SELECT
    USING (true);

-- Policy: INSERT (Admins/Professors only)
CREATE POLICY "Professores e Admins podem criar disciplinas"
    ON public.disciplinas
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- User is a professor
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = auth.uid()
        )
        OR
        -- User is a superadmin
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
        OR
        -- User is an entreprise admin (via metadata or check)
        (current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
    );

-- Policy: UPDATE (Admins/Professors only)
CREATE POLICY "Professores e Admins podem atualizar disciplinas"
    ON public.disciplinas
    FOR UPDATE
    TO authenticated
    USING (
        -- User is a professor
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = auth.uid()
        )
        OR
        -- User is a superadmin
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
        OR
        -- User is an entreprise admin
        (current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
    )
    WITH CHECK (
        -- Same checks
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
        OR
        (current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
    );

-- Policy: DELETE (Admins/Professors only)
CREATE POLICY "Professores e Admins podem deletar disciplinas"
    ON public.disciplinas
    FOR DELETE
    TO authenticated
    USING (
        -- User is a professor
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = auth.uid()
        )
        OR
        -- User is a superadmin
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
        OR
        -- User is an entreprise admin
        (current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
    );


-- 2. Policies for 'cursos_disciplinas'
ALTER TABLE public.cursos_disciplinas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Relações curso-disciplina são públicas" ON public.cursos_disciplinas;
DROP POLICY IF EXISTS "Professores gerenciam relações curso-disciplina" ON public.cursos_disciplinas;

-- Policy: SELECT (Public)
CREATE POLICY "Relações curso-disciplina são públicas"
    ON public.cursos_disciplinas
    FOR SELECT
    USING (true);

-- Policy: ALL (Admins/Professors only) - simplifying management to one policy
CREATE POLICY "Professores e Admins gerenciam relações"
    ON public.cursos_disciplinas
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
        OR
        (current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
        OR
        (current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
    );
