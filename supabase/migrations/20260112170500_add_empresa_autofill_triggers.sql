-- Migration: Auto-fill empresa_id to prevent "solto" rows
-- Description:
-- - Auto-fill empresa_id based on parent (curso/modulo) when omitted
-- - Keeps data consistent even when inserts bypass RLS (service role)
-- Date: 2026-01-12

BEGIN;

-- 0) frentes: empresa_id from cursos
CREATE OR REPLACE FUNCTION public.set_frentes_empresa_id_from_curso()
RETURNS TRIGGER AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  IF NEW.curso_id IS NULL THEN
    RAISE EXCEPTION 'frentes.curso_id é obrigatório';
  END IF;

  SELECT empresa_id INTO v_empresa_id
  FROM public.cursos
  WHERE id = NEW.curso_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível determinar empresa_id do curso %', NEW.curso_id;
  END IF;

  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := v_empresa_id;
  ELSIF NEW.empresa_id <> v_empresa_id THEN
    RAISE EXCEPTION 'empresa_id da frente (%) difere do empresa_id do curso (%)', NEW.empresa_id, v_empresa_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_frentes_set_empresa_id ON public.frentes;
CREATE TRIGGER trg_frentes_set_empresa_id
  BEFORE INSERT OR UPDATE ON public.frentes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_frentes_empresa_id_from_curso();

-- 0.1) modulos: curso_id/empresa_id from frentes
CREATE OR REPLACE FUNCTION public.set_modulos_curso_empresa_from_frente()
RETURNS TRIGGER AS $$
DECLARE
  v_curso_id uuid;
  v_empresa_id uuid;
BEGIN
  IF NEW.frente_id IS NULL THEN
    RAISE EXCEPTION 'modulos.frente_id é obrigatório';
  END IF;

  SELECT curso_id, empresa_id INTO v_curso_id, v_empresa_id
  FROM public.frentes
  WHERE id = NEW.frente_id;

  IF v_curso_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível determinar curso_id da frente %', NEW.frente_id;
  END IF;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível determinar empresa_id da frente %', NEW.frente_id;
  END IF;

  IF NEW.curso_id IS NULL THEN
    NEW.curso_id := v_curso_id;
  ELSIF NEW.curso_id <> v_curso_id THEN
    RAISE EXCEPTION 'curso_id do módulo (%) difere do curso_id da frente (%)', NEW.curso_id, v_curso_id;
  END IF;

  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := v_empresa_id;
  ELSIF NEW.empresa_id <> v_empresa_id THEN
    RAISE EXCEPTION 'empresa_id do módulo (%) difere do empresa_id da frente (%)', NEW.empresa_id, v_empresa_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_modulos_set_curso_empresa ON public.modulos;
CREATE TRIGGER trg_modulos_set_curso_empresa
  BEFORE INSERT OR UPDATE ON public.modulos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_modulos_curso_empresa_from_frente();

-- 1) flashcards: empresa_id from modulos
CREATE OR REPLACE FUNCTION public.set_flashcard_empresa_id_from_modulo()
RETURNS TRIGGER AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  IF NEW.modulo_id IS NULL THEN
    RAISE EXCEPTION 'flashcards.modulo_id é obrigatório';
  END IF;

  SELECT empresa_id INTO v_empresa_id
  FROM public.modulos
  WHERE id = NEW.modulo_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível determinar empresa_id do módulo %', NEW.modulo_id;
  END IF;

  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := v_empresa_id;
  ELSIF NEW.empresa_id <> v_empresa_id THEN
    RAISE EXCEPTION 'empresa_id do flashcard (%) difere do empresa_id do módulo (%)', NEW.empresa_id, v_empresa_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_flashcards_set_empresa_id ON public.flashcards;
CREATE TRIGGER trg_flashcards_set_empresa_id
  BEFORE INSERT OR UPDATE ON public.flashcards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_flashcard_empresa_id_from_modulo();

-- 2) materiais_curso: empresa_id from cursos
CREATE OR REPLACE FUNCTION public.set_materiais_curso_empresa_id_from_curso()
RETURNS TRIGGER AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  IF NEW.curso_id IS NULL THEN
    RAISE EXCEPTION 'materiais_curso.curso_id é obrigatório';
  END IF;

  SELECT empresa_id INTO v_empresa_id
  FROM public.cursos
  WHERE id = NEW.curso_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível determinar empresa_id do curso %', NEW.curso_id;
  END IF;

  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := v_empresa_id;
  ELSIF NEW.empresa_id <> v_empresa_id THEN
    RAISE EXCEPTION 'empresa_id do material (%) difere do empresa_id do curso (%)', NEW.empresa_id, v_empresa_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_materiais_curso_set_empresa_id ON public.materiais_curso;
CREATE TRIGGER trg_materiais_curso_set_empresa_id
  BEFORE INSERT OR UPDATE ON public.materiais_curso
  FOR EACH ROW
  EXECUTE FUNCTION public.set_materiais_curso_empresa_id_from_curso();

-- 3) atividades: empresa_id from modulos
CREATE OR REPLACE FUNCTION public.set_atividades_empresa_id_from_modulo()
RETURNS TRIGGER AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  IF NEW.modulo_id IS NULL THEN
    RAISE EXCEPTION 'atividades.modulo_id é obrigatório';
  END IF;

  SELECT empresa_id INTO v_empresa_id
  FROM public.modulos
  WHERE id = NEW.modulo_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível determinar empresa_id do módulo %', NEW.modulo_id;
  END IF;

  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := v_empresa_id;
  ELSIF NEW.empresa_id <> v_empresa_id THEN
    RAISE EXCEPTION 'empresa_id da atividade (%) difere do empresa_id do módulo (%)', NEW.empresa_id, v_empresa_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atividades_set_empresa_id ON public.atividades;
CREATE TRIGGER trg_atividades_set_empresa_id
  BEFORE INSERT OR UPDATE ON public.atividades
  FOR EACH ROW
  EXECUTE FUNCTION public.set_atividades_empresa_id_from_modulo();

COMMIT;

