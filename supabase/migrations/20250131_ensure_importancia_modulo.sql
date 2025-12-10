-- Migration: Ensure importancia column exists in modulos table
-- Description: Creates enum_importancia_modulo type and adds importancia column to modulos table if they don't exist
-- Author: Auto-generated
-- Date: 2025-01-31

-- 1. Create enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_importancia_modulo') THEN
        CREATE TYPE enum_importancia_modulo AS ENUM ('Alta', 'Media', 'Baixa', 'Base');
    END IF;
END
$$;

-- 2. Add importancia column to modulos table if it doesn't exist
ALTER TABLE public.modulos
    ADD COLUMN IF NOT EXISTS importancia enum_importancia_modulo DEFAULT 'Media';

-- 3. Add comment to column
COMMENT ON COLUMN public.modulos.importancia IS 'Nível de importância do módulo. Usado no modo "Mais Cobrados" dos flashcards para priorizar conteúdo mais cobrado nas provas. Valores: Alta, Media, Baixa, Base (padrão: Media)';

-- 4. Create index for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_modulos_importancia ON public.modulos(importancia);

-- 5. Update existing modules without importancia to 'Media' (if any)
UPDATE public.modulos
SET importancia = 'Media'
WHERE importancia IS NULL;

