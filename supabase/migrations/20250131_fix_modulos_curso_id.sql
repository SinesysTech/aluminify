-- Migration: Fix curso_id in modulos table
-- Description: 
-- 1. Updates existing modules to have curso_id from their associated frente
-- 2. Updates importar_cronograma_aulas function to also update curso_id when updating modules
-- 3. Creates a trigger to automatically set curso_id from frente when a module is created
-- Author: Auto-generated
-- Date: 2025-01-31

-- 1. Update existing modules to get curso_id from their frente
UPDATE public.modulos m
SET curso_id = f.curso_id
FROM public.frentes f
WHERE m.frente_id = f.id
  AND m.curso_id IS NULL
  AND f.curso_id IS NOT NULL;

-- 2. Drop and recreate importar_cronograma_aulas function to also update curso_id when updating modules
DROP FUNCTION IF EXISTS public.importar_cronograma_aulas(uuid, text, text, jsonb);

CREATE FUNCTION public.importar_cronograma_aulas(
  p_curso_id uuid,
  p_disciplina_nome text,
  p_frente_nome text,
  p_conteudo jsonb
)
returns table(modulos_importados integer, aulas_importadas integer) as
$$
declare
  v_disciplina_id uuid;
  v_frente_id uuid;
  v_modulos_importados int := 0;
  v_aulas_importadas int := 0;
  v_row jsonb;
  v_modulo_numero int;
  v_modulo_nome text;
  v_aula_numero int;
  v_aula_nome text;
  v_tempo int;
  v_prioridade int;
  v_importancia enum_importancia_modulo;
  v_modulo_id uuid;
  v_aula_id uuid;
begin
  if p_conteudo is null or jsonb_typeof(p_conteudo) <> 'array' then
    raise exception 'p_conteudo deve ser um array JSON';
  end if;

  select id into v_disciplina_id
  from public.disciplinas
  where unaccent(lower(nome)) = unaccent(lower(p_disciplina_nome))
  limit 1;

  if v_disciplina_id is null then
    raise exception 'Disciplina "%" não encontrada', p_disciplina_nome;
  end if;

  -- Garantir frente (upsert por nome + curso)
  select id into v_frente_id
  from public.frentes
  where disciplina_id = v_disciplina_id
    and (curso_id = p_curso_id or (curso_id is null and p_curso_id is null))
    and unaccent(lower(nome)) = unaccent(lower(p_frente_nome))
  limit 1;

  if v_frente_id is null then
    insert into public.frentes (disciplina_id, curso_id, nome)
    values (v_disciplina_id, p_curso_id, p_frente_nome)
    returning id into v_frente_id;
  else
    -- Atualizar curso_id da frente se estiver NULL
    update public.frentes
    set curso_id = p_curso_id
    where id = v_frente_id
      and curso_id IS NULL;
  end if;

  for v_row in select * from jsonb_array_elements(p_conteudo)
  loop
    v_modulo_numero := coalesce((v_row->>'modulo_numero')::int, null);
    v_modulo_nome   := nullif(v_row->>'modulo_nome', '');
    v_aula_numero   := coalesce((v_row->>'aula_numero')::int, null);
    v_aula_nome     := nullif(v_row->>'aula_nome', '');
    v_tempo         := coalesce((v_row->>'tempo')::int, null);
    v_prioridade    := coalesce((v_row->>'prioridade')::int, null);
    v_importancia   := nullif(v_row->>'importancia', '')::enum_importancia_modulo;
    if v_importancia is null then
      v_importancia := 'Media';
    end if;

    if v_modulo_numero is null or v_modulo_nome is null or v_aula_nome is null then
      continue;
    end if;

    -- Upsert módulo por frente + número
    select id into v_modulo_id
    from public.modulos
    where frente_id = v_frente_id
      and numero_modulo = v_modulo_numero
    limit 1;

    if v_modulo_id is null then
      insert into public.modulos (frente_id, curso_id, nome, numero_modulo, importancia)
      values (v_frente_id, p_curso_id, v_modulo_nome, v_modulo_numero, v_importancia)
      returning id into v_modulo_id;
      v_modulos_importados := v_modulos_importados + 1;
    else
      -- Atualizar também o curso_id quando atualizar módulo existente
      update public.modulos
      set nome = coalesce(v_modulo_nome, nome),
          importancia = v_importancia,
          curso_id = coalesce(p_curso_id, curso_id)
      where id = v_modulo_id;
    end if;

    -- Upsert aula por módulo + número
    select id into v_aula_id
    from public.aulas
    where modulo_id = v_modulo_id
      and numero_aula = v_aula_numero
    limit 1;

    if v_aula_id is null then
      insert into public.aulas (modulo_id, nome, numero_aula, tempo_estimado_minutos, prioridade)
      values (v_modulo_id, v_aula_nome, v_aula_numero, v_tempo, v_prioridade)
      returning id into v_aula_id;
      v_aulas_importadas := v_aulas_importadas + 1;
    else
      update public.aulas
      set nome = coalesce(v_aula_nome, nome),
          tempo_estimado_minutos = coalesce(v_tempo, tempo_estimado_minutos),
          prioridade = coalesce(v_prioridade, prioridade)
      where id = v_aula_id;
    end if;
  end loop;

  return query select v_modulos_importados, v_aulas_importadas;
end;
$$ language plpgsql security definer;

-- 3. Create trigger function to automatically set curso_id from frente when module is created
CREATE OR REPLACE FUNCTION public.set_modulo_curso_id_from_frente()
RETURNS TRIGGER AS $$
BEGIN
  -- Se curso_id não foi fornecido, buscar da frente
  IF NEW.curso_id IS NULL AND NEW.frente_id IS NOT NULL THEN
    SELECT curso_id INTO NEW.curso_id
    FROM public.frentes
    WHERE id = NEW.frente_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
DROP TRIGGER IF EXISTS trigger_set_modulo_curso_id ON public.modulos;
CREATE TRIGGER trigger_set_modulo_curso_id
  BEFORE INSERT OR UPDATE ON public.modulos
  FOR EACH ROW
  WHEN (NEW.curso_id IS NULL)
  EXECUTE FUNCTION public.set_modulo_curso_id_from_frente();

-- 5. Add comment
COMMENT ON FUNCTION public.set_modulo_curso_id_from_frente() IS 'Automatically sets curso_id from the associated frente when a module is created or updated without curso_id';

