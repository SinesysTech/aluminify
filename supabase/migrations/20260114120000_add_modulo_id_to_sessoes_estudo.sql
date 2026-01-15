-- Migration: Add modulo_id to sessoes_estudo for module-level analytics
-- Date: 2026-01-14

BEGIN;

-- 1) Column
ALTER TABLE public.sessoes_estudo
  ADD COLUMN IF NOT EXISTS modulo_id UUID;

COMMENT ON COLUMN public.sessoes_estudo.modulo_id IS
  'Módulo associado à sessão de estudo. Preenchido preferencialmente no início da sessão; pode ser backfilled via atividade_relacionada_id.';

-- 2) FK (ON DELETE SET NULL para não bloquear exclusões)
DO $$
DECLARE
  r record;
BEGIN
  -- Remover FKs existentes na coluna (defensivo)
  FOR r IN
    SELECT DISTINCT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN unnest(con.conkey) AS k(attnum) ON TRUE
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = k.attnum
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND rel.relname = 'sessoes_estudo'
      AND att.attname = 'modulo_id'
  LOOP
    EXECUTE format('ALTER TABLE public.sessoes_estudo DROP CONSTRAINT %I', r.conname);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND rel.relname = 'sessoes_estudo'
      AND con.conname = 'fk_sessoes_estudo_modulo_id'
  ) THEN
    ALTER TABLE public.sessoes_estudo
      ADD CONSTRAINT fk_sessoes_estudo_modulo_id
      FOREIGN KEY (modulo_id)
      REFERENCES public.modulos(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Index (analytics)
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_aluno_modulo_inicio
  ON public.sessoes_estudo(aluno_id, modulo_id, inicio);

-- 4) Backfill (quando a sessão estiver ligada a uma atividade)
UPDATE public.sessoes_estudo se
SET modulo_id = a.modulo_id
FROM public.atividades a
WHERE se.modulo_id IS NULL
  AND se.atividade_relacionada_id IS NOT NULL
  AND a.id = se.atividade_relacionada_id
  AND a.modulo_id IS NOT NULL;

COMMIT;

