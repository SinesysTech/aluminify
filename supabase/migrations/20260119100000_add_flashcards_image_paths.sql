-- Migration: Add image path fields to flashcards
-- Description: Adds nullable storage object paths for question/answer images
-- Date: 2026-01-19

BEGIN;

ALTER TABLE public.flashcards
  ADD COLUMN IF NOT EXISTS pergunta_imagem_path text,
  ADD COLUMN IF NOT EXISTS resposta_imagem_path text;

COMMENT ON COLUMN public.flashcards.pergunta_imagem_path IS 'Supabase Storage object path for the question image (bucket: flashcards-images).';
COMMENT ON COLUMN public.flashcards.resposta_imagem_path IS 'Supabase Storage object path for the answer image (bucket: flashcards-images).';

COMMIT;

