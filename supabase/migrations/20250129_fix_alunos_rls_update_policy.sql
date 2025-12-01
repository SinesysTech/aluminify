-- Migration: Fix alunos RLS UPDATE policy
-- Description: Adiciona WITH CHECK à política de UPDATE para permitir que alunos atualizem seus próprios dados
-- Author: Auto
-- Date: 2025-01-29

-- Remove a política antiga se existir
DROP POLICY IF EXISTS "Users can update their own aluno data" ON public.alunos;

-- Cria a política correta com USING e WITH CHECK
CREATE POLICY "Users can update their own aluno data"
    ON public.alunos FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);




