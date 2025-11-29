-- Migration: Add velocidade_reproducao to cronogramas
-- Description: Adiciona campo para armazenar a velocidade de reprodução das aulas (1.00x, 1.25x, 1.50x, 2.00x)
-- Author: Auto
-- Date: 2025-01-27

-- Adicionar coluna velocidade_reproducao na tabela cronogramas
ALTER TABLE public.cronogramas
ADD COLUMN IF NOT EXISTS velocidade_reproducao NUMERIC(3, 2) DEFAULT 1.00;

-- Adicionar constraint para garantir valores válidos (1.00, 1.25, 1.50, 2.00)
ALTER TABLE public.cronogramas
ADD CONSTRAINT check_velocidade_reproducao 
CHECK (velocidade_reproducao IN (1.00, 1.25, 1.50, 2.00));

-- Comentário na coluna
COMMENT ON COLUMN public.cronogramas.velocidade_reproducao IS 'Velocidade de reprodução das aulas: 1.00x (ideal), 1.25x (até que vai...), 1.50x (não recomendo, mas você que sabe...), 2.00x (ver rápido pra ver duas vezes, né?)';





