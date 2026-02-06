-- Fix get_student_plantao_quota function
-- The function was using 'aluno_id' but the column is 'usuario_id' in alunos_cursos table

CREATE OR REPLACE FUNCTION public.get_student_plantao_quota(p_usuario_id uuid, p_empresa_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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
