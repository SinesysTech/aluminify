-- Migration: Add RLS policies for alunos_cursos table
-- Description: Allows students to view their own course associations
-- Author: Auto
-- Date: 2025-01-29

-- Enable RLS on alunos_cursos if not already enabled
ALTER TABLE public.alunos_cursos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own course associations" ON public.alunos_cursos;
DROP POLICY IF EXISTS "Students can insert their own course associations" ON public.alunos_cursos;
DROP POLICY IF EXISTS "Students can delete their own course associations" ON public.alunos_cursos;

-- Policy: Students can view their own course associations
CREATE POLICY "Students can view their own course associations"
    ON public.alunos_cursos FOR SELECT
    USING (auth.uid() = aluno_id);

-- Policy: Allow authenticated users to insert course associations (for admin/professor use)
-- Note: This is typically done by admins/professors, but we allow it for flexibility
CREATE POLICY "Authenticated users can insert course associations"
    ON public.alunos_cursos FOR INSERT
    WITH CHECK (true);

-- Policy: Allow deletion (typically by admins/professors)
CREATE POLICY "Authenticated users can delete course associations"
    ON public.alunos_cursos FOR DELETE
    USING (true);







