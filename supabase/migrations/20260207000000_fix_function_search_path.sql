-- Fix function search_path security warning
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

CREATE OR REPLACE FUNCTION public.get_student_plantao_quota(p_usuario_id uuid, p_empresa_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare
  v_course_quota integer;
  v_extra_quota integer;
begin
  -- Get total from courses
  select coalesce(sum(cpq.quota_mensal), 0)
  into v_course_quota
  from alunos_cursos ac
  join curso_plantao_quotas cpq on ac.curso_id = cpq.curso_id
  where ac.usuario_id = p_usuario_id
  and cpq.empresa_id = p_empresa_id;

  -- Get extra quota from user profile
  select coalesce(quota_extra, 0)
  into v_extra_quota
  from usuarios
  where id = p_usuario_id;

  return v_course_quota + v_extra_quota;
end;
$function$;
