-- Migration: Fix alunos RLS UPDATE policy for password fields
-- Description: Garante que alunos possam atualizar must_change_password e senha_temporaria
-- Author: Auto
-- Date: 2026-01-05

-- Remove a política antiga se existir
DROP POLICY IF EXISTS "Users can update their own aluno data" ON public.alunos;

-- Cria a política correta com USING e WITH CHECK
-- Esta política permite que alunos atualizem seus próprios dados, incluindo campos de senha
CREATE POLICY "Users can update their own aluno data"
    ON public.alunos FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Comentário explicativo
COMMENT ON POLICY "Users can update their own aluno data" ON public.alunos IS 
'Permite que alunos atualizem seus próprios dados, incluindo must_change_password e senha_temporaria';


