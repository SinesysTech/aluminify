-- Migration: Add password metadata and course relations for students
-- Description: Adds must_change_password flag, temporary password storage, and alunos_cursos join table.
-- Author: GPT-5.1 Codex
-- Date: 2025-01-24

-- Add password-related columns to alunos
ALTER TABLE public.alunos
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS senha_temporaria TEXT;

-- Create relation table between alunos and cursos
CREATE TABLE IF NOT EXISTS public.alunos_cursos (
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (aluno_id, curso_id)
);

-- Optional index to speed up lookups by curso
CREATE INDEX IF NOT EXISTS idx_alunos_cursos_curso_id ON public.alunos_cursos (curso_id);




















