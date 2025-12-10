-- Migration: Ensure created_by is automatically filled for disciplinas
-- Description: 
-- 1. Ensures trigger exists and works correctly for disciplinas
-- 2. Updates existing disciplinas without created_by (if possible to determine)
-- Author: Auto-generated
-- Date: 2025-01-31

-- 1. Ensure handle_created_by function exists (should already exist)
CREATE OR REPLACE FUNCTION public.handle_created_by()
RETURNS TRIGGER AS $$
BEGIN
    -- Se não foi enviado manualmente, usa o ID do usuário autenticado
    IF NEW.created_by IS NULL THEN
        NEW.created_by := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop existing trigger if it exists and recreate it to ensure it's correct
DROP TRIGGER IF EXISTS set_created_by_disciplinas ON public.disciplinas;

CREATE TRIGGER set_created_by_disciplinas 
    BEFORE INSERT ON public.disciplinas 
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_created_by();

-- 3. Add comment
COMMENT ON TRIGGER set_created_by_disciplinas ON public.disciplinas IS 'Automatically sets created_by to the authenticated user when a disciplina is created';

-- 4. Update existing disciplinas without created_by
-- Since there's only one professor in the system, assign all existing disciplinas to that professor
UPDATE public.disciplinas
SET created_by = (SELECT id FROM public.professores LIMIT 1)
WHERE created_by IS NULL;

-- Note: This assumes there's only one professor. If there are multiple professors,
-- you may need to manually update the created_by field based on who actually created each disciplina.

