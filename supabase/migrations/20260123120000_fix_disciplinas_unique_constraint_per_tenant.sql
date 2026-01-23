-- Migration: Fix disciplinas unique constraint to be per-tenant
-- Problem: The unique constraint on 'nome' is global, not per empresa_id
-- This causes "discipline already exists" errors when different tenants try
-- to create disciplines with the same name (e.g., "Filosofia")

-- Step 1: Drop the global unique constraint on 'nome'
-- The constraint might be named 'disciplinas_nome_key' (default naming)
DO $$
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'disciplinas_nome_key'
        AND conrelid = 'public.disciplinas'::regclass
    ) THEN
        ALTER TABLE public.disciplinas DROP CONSTRAINT disciplinas_nome_key;
        RAISE NOTICE 'Dropped constraint disciplinas_nome_key';
    ELSE
        RAISE NOTICE 'Constraint disciplinas_nome_key does not exist, checking for unique index...';
    END IF;
END $$;

-- Also try to drop if it's an index instead of a constraint
DROP INDEX IF EXISTS public.disciplinas_nome_key;

-- Step 2: Create a new unique constraint that includes empresa_id
-- This allows different tenants to have disciplines with the same name
ALTER TABLE public.disciplinas
    ADD CONSTRAINT disciplinas_empresa_id_nome_key UNIQUE (empresa_id, nome);

-- Step 3: Add comment explaining the constraint
COMMENT ON CONSTRAINT disciplinas_empresa_id_nome_key ON public.disciplinas IS
    'Ensures discipline names are unique within each tenant (empresa), allowing different tenants to have disciplines with the same name';

-- Step 4: Update RLS policies to include empresa_id filtering
-- This ensures proper tenant isolation for INSERT, UPDATE, DELETE operations

-- Drop existing write policies for disciplinas
DROP POLICY IF EXISTS "Professores criam disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Professores editam suas disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Professores deletam suas disciplinas" ON public.disciplinas;

-- Recreate INSERT policy with empresa_id check
CREATE POLICY "Professores criam disciplinas em sua empresa"
    ON public.disciplinas
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Must be a professor
        EXISTS (SELECT 1 FROM public.professores WHERE id = (SELECT auth.uid()))
        AND (
            -- Insert for own empresa
            empresa_id = public.get_user_empresa_id()
            OR
            -- Superadmin can insert for any empresa
            EXISTS (
                SELECT 1 FROM auth.users
                WHERE id = (SELECT auth.uid())
                AND raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

-- Recreate UPDATE policy with empresa_id check
CREATE POLICY "Professores editam disciplinas de sua empresa"
    ON public.disciplinas
    FOR UPDATE
    TO authenticated
    USING (
        -- Creator can edit their own disciplines within their empresa
        (created_by = (SELECT auth.uid()) AND empresa_id = public.get_user_empresa_id())
        OR
        -- Admin of the empresa can edit any discipline in their empresa
        (empresa_id = public.get_user_empresa_id() AND public.is_empresa_admin())
        OR
        -- Superadmin can edit any discipline
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = (SELECT auth.uid())
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    WITH CHECK (
        -- Same conditions for the new values
        (created_by = (SELECT auth.uid()) AND empresa_id = public.get_user_empresa_id())
        OR
        (empresa_id = public.get_user_empresa_id() AND public.is_empresa_admin())
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = (SELECT auth.uid())
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- Recreate DELETE policy with empresa_id check
CREATE POLICY "Professores deletam disciplinas de sua empresa"
    ON public.disciplinas
    FOR DELETE
    TO authenticated
    USING (
        -- Creator can delete their own disciplines within their empresa
        (created_by = (SELECT auth.uid()) AND empresa_id = public.get_user_empresa_id())
        OR
        -- Admin of the empresa can delete any discipline in their empresa
        (empresa_id = public.get_user_empresa_id() AND public.is_empresa_admin())
        OR
        -- Superadmin can delete any discipline
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = (SELECT auth.uid())
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- Step 5: Update SELECT policy to filter by tenant
-- Keep public catalog but only show disciplines from user's empresa
DROP POLICY IF EXISTS "Catálogo de Disciplinas é Público" ON public.disciplinas;

CREATE POLICY "Disciplinas visíveis para usuários da mesma empresa"
    ON public.disciplinas
    FOR SELECT
    TO authenticated
    USING (
        -- Users can see disciplines from their empresa
        empresa_id = public.get_user_empresa_id()
        OR
        -- Superadmin can see all
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = (SELECT auth.uid())
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    );
