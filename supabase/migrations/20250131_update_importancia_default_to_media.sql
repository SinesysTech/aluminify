-- Migration: Update importancia default value to 'Media'
-- Description: Changes the default value of importancia column from 'Base' to 'Media'
-- Author: Auto-generated
-- Date: 2025-01-31

-- Alter the default value of importancia column
ALTER TABLE public.modulos
    ALTER COLUMN importancia SET DEFAULT 'Media';

-- Update existing modules with 'Base' to 'Media' (new default)
UPDATE public.modulos 
SET importancia = 'Media' 
WHERE importancia = 'Base';

-- Update existing modules with NULL to 'Media'
UPDATE public.modulos 
SET importancia = 'Media' 
WHERE importancia IS NULL;

-- Update comment to reflect new default
COMMENT ON COLUMN public.modulos.importancia IS 'Nível de importância do módulo. Usado no modo "Mais Cobrados" dos flashcards para priorizar conteúdo mais cobrado nas provas. Valores: Alta, Media, Baixa, Base (padrão: Media)';

