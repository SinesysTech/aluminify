-- Migration: Fix RLS policy for INSERT on professores table
-- Description: Adds missing INSERT policy to allow professors to create their own record
-- Author: Auto-generated
-- Date: 2025-01-28

-- Ensure RLS is enabled
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Professores podem criar seu próprio registro" ON public.professores;

-- Create policy to allow users to insert their own professor record
CREATE POLICY "Professores podem criar seu próprio registro" ON public.professores 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "Professores podem criar seu próprio registro" ON public.professores IS 
    'Allows authenticated users to create their own professor record when logging in';










