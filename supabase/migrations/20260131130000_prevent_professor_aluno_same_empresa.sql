-- Migration: Impede professor e aluno na mesma empresa
-- Description: Um usuário não pode ser professor e aluno na MESMA empresa/tenant.
--              Professor pode ser aluno em outra empresa. Em conflito, mantém professor
--              e remove aluno (evita erro "acesso negado" em structure-client por maybeSingle).
-- Date: 2026-01-31

BEGIN;

-- 1. Limpar dados existentes: remover vínculo aluno quando já existe professor/usuario
DELETE FROM public.usuarios_empresas ue_aluno
WHERE ue_aluno.papel_base = 'aluno'
  AND ue_aluno.ativo = true
  AND ue_aluno.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.usuarios_empresas ue_staff
    WHERE ue_staff.usuario_id = ue_aluno.usuario_id
      AND ue_staff.empresa_id = ue_aluno.empresa_id
      AND ue_staff.papel_base IN ('professor', 'usuario')
      AND ue_staff.ativo = true
      AND ue_staff.deleted_at IS NULL
      AND ue_staff.id != ue_aluno.id
  );

-- 2. Trigger: impedir professor+aluno na mesma empresa
CREATE OR REPLACE FUNCTION public.check_no_professor_and_aluno_same_empresa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.papel_base = 'aluno' THEN
    IF EXISTS (
      SELECT 1 FROM public.usuarios_empresas
      WHERE usuario_id = NEW.usuario_id
        AND empresa_id = NEW.empresa_id
        AND papel_base IN ('professor', 'usuario')
        AND ativo = true
        AND deleted_at IS NULL
        AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) THEN
      RAISE EXCEPTION 'Este usuário já é professor ou administrador nesta empresa e não pode ser aluno na mesma instituição.';
    END IF;
  ELSIF NEW.papel_base IN ('professor', 'usuario') THEN
    IF EXISTS (
      SELECT 1 FROM public.usuarios_empresas
      WHERE usuario_id = NEW.usuario_id
        AND empresa_id = NEW.empresa_id
        AND papel_base = 'aluno'
        AND ativo = true
        AND deleted_at IS NULL
        AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) THEN
      RAISE EXCEPTION 'Este usuário já é aluno nesta empresa e não pode ser professor ou administrador na mesma instituição.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_no_professor_aluno_same_empresa ON public.usuarios_empresas;
CREATE TRIGGER trg_check_no_professor_aluno_same_empresa
  BEFORE INSERT OR UPDATE OF usuario_id, empresa_id, papel_base, ativo, deleted_at
  ON public.usuarios_empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.check_no_professor_and_aluno_same_empresa();

COMMENT ON FUNCTION public.check_no_professor_and_aluno_same_empresa() IS
  'Garante que um usuário não tenha papel professor e aluno na mesma empresa. Professor pode ser aluno em outra empresa.';

COMMIT;
