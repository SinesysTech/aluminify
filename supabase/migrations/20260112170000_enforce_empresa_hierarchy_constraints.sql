-- Migration: Enforce strict hierarchy bindings (empresa/curso/frente/modulo)
-- Description:
-- - Backfill missing curso_id/empresa_id across hierarchy
-- - Enforce NOT NULL and composite foreign keys to prevent orphan/foreign-tenant rows
-- Date: 2026-01-12

BEGIN;

-- 1) Backfill frentes.curso_id from modulos when possible (single distinct course per frente)
UPDATE public.frentes f
SET curso_id = x.curso_id
FROM (
  SELECT frente_id, max(curso_id) as curso_id
  FROM public.modulos
  WHERE curso_id IS NOT NULL
  GROUP BY frente_id
  HAVING COUNT(DISTINCT curso_id) = 1
) x
WHERE f.id = x.frente_id
  AND f.curso_id IS NULL;

-- 2) Backfill frentes.empresa_id from cursos
UPDATE public.frentes f
SET empresa_id = c.empresa_id
FROM public.cursos c
WHERE f.curso_id = c.id
  AND f.empresa_id IS NULL
  AND c.empresa_id IS NOT NULL;

-- 3) Backfill modulos.curso_id from frentes (in addition to existing trigger)
UPDATE public.modulos m
SET curso_id = f.curso_id
FROM public.frentes f
WHERE m.frente_id = f.id
  AND m.curso_id IS NULL
  AND f.curso_id IS NOT NULL;

-- 4) Backfill modulos.empresa_id from frentes/cursos
UPDATE public.modulos m
SET empresa_id = f.empresa_id
FROM public.frentes f
WHERE m.frente_id = f.id
  AND m.empresa_id IS NULL
  AND f.empresa_id IS NOT NULL;

UPDATE public.modulos m
SET empresa_id = c.empresa_id
FROM public.cursos c
WHERE m.curso_id = c.id
  AND m.empresa_id IS NULL
  AND c.empresa_id IS NOT NULL;

-- 5) Backfill flashcards.empresa_id from modulos
UPDATE public.flashcards fc
SET empresa_id = m.empresa_id
FROM public.modulos m
WHERE fc.modulo_id = m.id
  AND fc.empresa_id IS NULL
  AND m.empresa_id IS NOT NULL;

-- 6) Backfill materiais_curso.empresa_id from cursos
UPDATE public.materiais_curso mc
SET empresa_id = c.empresa_id
FROM public.cursos c
WHERE mc.curso_id = c.id
  AND mc.empresa_id IS NULL
  AND c.empresa_id IS NOT NULL;

-- 7) Backfill atividades.empresa_id from modulos
UPDATE public.atividades a
SET empresa_id = m.empresa_id
FROM public.modulos m
WHERE a.modulo_id = m.id
  AND a.empresa_id IS NULL
  AND m.empresa_id IS NOT NULL;

-- 8) Safety checks: refuse to proceed if ambiguous/legacy data still exists
DO $$
BEGIN
  -- frentes with multiple distinct curso_id coming from modules indicates data inconsistency
  IF EXISTS (
    SELECT 1
    FROM public.modulos m
    WHERE m.curso_id IS NOT NULL
    GROUP BY m.frente_id
    HAVING COUNT(DISTINCT m.curso_id) > 1
  ) THEN
    RAISE EXCEPTION 'Inconsistência: existe frente com módulos apontando para cursos diferentes. Corrija antes de aplicar constraints.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.cursos WHERE empresa_id IS NULL) THEN
    RAISE EXCEPTION 'Existem cursos com empresa_id NULL. Corrija/backsfill antes de travar o schema.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.frentes WHERE curso_id IS NULL OR empresa_id IS NULL) THEN
    RAISE EXCEPTION 'Existem frentes com curso_id/empresa_id NULL. Corrija/backsfill antes de travar o schema.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.modulos WHERE frente_id IS NULL) THEN
    RAISE EXCEPTION 'Existem módulos com frente_id NULL. Corrija antes de travar o schema.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.modulos WHERE curso_id IS NULL OR empresa_id IS NULL) THEN
    RAISE EXCEPTION 'Existem módulos com curso_id/empresa_id NULL. Corrija/backsfill antes de travar o schema.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.flashcards WHERE modulo_id IS NULL) THEN
    RAISE EXCEPTION 'Existem flashcards com modulo_id NULL. Corrija antes de travar o schema.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.flashcards WHERE empresa_id IS NULL) THEN
    RAISE EXCEPTION 'Existem flashcards com empresa_id NULL. Corrija/backsfill antes de travar o schema.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.materiais_curso WHERE empresa_id IS NULL) THEN
    RAISE EXCEPTION 'Existem materiais_curso com empresa_id NULL. Corrija/backsfill antes de travar o schema.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.atividades WHERE modulo_id IS NULL) THEN
    RAISE EXCEPTION 'Existem atividades com modulo_id NULL. Corrija antes de travar o schema.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.atividades WHERE empresa_id IS NULL) THEN
    RAISE EXCEPTION 'Existem atividades com empresa_id NULL. Corrija/backsfill antes de travar o schema.';
  END IF;
END $$;

-- 9) Enforce NOT NULLs (after backfill)
ALTER TABLE public.cursos
  ALTER COLUMN empresa_id SET NOT NULL;

ALTER TABLE public.frentes
  ALTER COLUMN curso_id SET NOT NULL,
  ALTER COLUMN empresa_id SET NOT NULL;

ALTER TABLE public.modulos
  ALTER COLUMN frente_id SET NOT NULL,
  ALTER COLUMN curso_id SET NOT NULL,
  ALTER COLUMN empresa_id SET NOT NULL;

ALTER TABLE public.flashcards
  ALTER COLUMN modulo_id SET NOT NULL,
  ALTER COLUMN empresa_id SET NOT NULL;

ALTER TABLE public.materiais_curso
  ALTER COLUMN empresa_id SET NOT NULL;

ALTER TABLE public.atividades
  ALTER COLUMN modulo_id SET NOT NULL,
  ALTER COLUMN empresa_id SET NOT NULL;

-- 10) Create UNIQUE indexes required for composite FKs
CREATE UNIQUE INDEX IF NOT EXISTS ux_cursos_id_empresa_id
ON public.cursos(id, empresa_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_frentes_id_curso_empresa
ON public.frentes(id, curso_id, empresa_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_modulos_id_empresa
ON public.modulos(id, empresa_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_modulos_id_curso_empresa
ON public.modulos(id, curso_id, empresa_id);

-- 11) Add composite foreign keys to enforce same-tenant relationships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND rel.relname = 'frentes'
      AND con.conname = 'fk_frentes_curso_empresa'
  ) THEN
    ALTER TABLE public.frentes
      ADD CONSTRAINT fk_frentes_curso_empresa
      FOREIGN KEY (curso_id, empresa_id)
      REFERENCES public.cursos(id, empresa_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND rel.relname = 'modulos'
      AND con.conname = 'fk_modulos_frente_curso_empresa'
  ) THEN
    ALTER TABLE public.modulos
      ADD CONSTRAINT fk_modulos_frente_curso_empresa
      FOREIGN KEY (frente_id, curso_id, empresa_id)
      REFERENCES public.frentes(id, curso_id, empresa_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND rel.relname = 'modulos'
      AND con.conname = 'fk_modulos_curso_empresa'
  ) THEN
    ALTER TABLE public.modulos
      ADD CONSTRAINT fk_modulos_curso_empresa
      FOREIGN KEY (curso_id, empresa_id)
      REFERENCES public.cursos(id, empresa_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND rel.relname = 'flashcards'
      AND con.conname = 'fk_flashcards_modulo_empresa'
  ) THEN
    ALTER TABLE public.flashcards
      ADD CONSTRAINT fk_flashcards_modulo_empresa
      FOREIGN KEY (modulo_id, empresa_id)
      REFERENCES public.modulos(id, empresa_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND rel.relname = 'materiais_curso'
      AND con.conname = 'fk_materiais_curso_curso_empresa'
  ) THEN
    ALTER TABLE public.materiais_curso
      ADD CONSTRAINT fk_materiais_curso_curso_empresa
      FOREIGN KEY (curso_id, empresa_id)
      REFERENCES public.cursos(id, empresa_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND rel.relname = 'atividades'
      AND con.conname = 'fk_atividades_modulo_empresa'
  ) THEN
    ALTER TABLE public.atividades
      ADD CONSTRAINT fk_atividades_modulo_empresa
      FOREIGN KEY (modulo_id, empresa_id)
      REFERENCES public.modulos(id, empresa_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 12) Helpful indexes for common filters and joins
CREATE INDEX IF NOT EXISTS idx_frentes_empresa_id ON public.frentes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_modulos_empresa_id ON public.modulos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_empresa_id ON public.flashcards(empresa_id);
CREATE INDEX IF NOT EXISTS idx_materiais_curso_empresa_id ON public.materiais_curso(empresa_id);
CREATE INDEX IF NOT EXISTS idx_atividades_empresa_id ON public.atividades(empresa_id);

COMMIT;

