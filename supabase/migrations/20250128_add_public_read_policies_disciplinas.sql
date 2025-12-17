-- Migration: Add public read policy for disciplinas
-- Description: Allows public read access to disciplinas table so students can view disciplines
-- Author: Auto-generated
-- Date: 2025-01-28

-- Add public read policy for disciplinas (catálogo público)
-- This allows students and other users to read disciplines for catalog purposes
DROP POLICY IF EXISTS "Catálogo de Disciplinas é Público" ON public.disciplinas;

CREATE POLICY "Catálogo de Disciplinas é Público" 
    ON public.disciplinas 
    FOR SELECT 
    USING (true);







