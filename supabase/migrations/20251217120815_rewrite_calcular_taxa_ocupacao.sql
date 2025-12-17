-- Migration: Rewrite calcular_taxa_ocupacao to compute actual slots
-- Description: A função agora calcula slots reais disponíveis no período, expandindo recorrências para dias específicos e subtraindo bloqueios
-- Author: Auto-generated
-- Date: 2025-12-17

-- Recreate the function with proper slot calculation
create or replace function public.calcular_taxa_ocupacao(
    empresa_id_param uuid,
    data_inicio_param date,
    data_fim_param date
)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
    total_slots numeric := 0;
    slots_ocupados numeric := 0;
    slots_bloqueados numeric := 0;
    taxa numeric;
    rec_record record;
    dia_record date;
    hora_inicio_minutes int;
    hora_fim_minutes int;
    slots_per_rec_per_dia numeric;
    bloqueio_record record;
begin
    -- Para cada dia no período
    for dia_record in
        select generate_series(
            calcular_taxa_ocupacao.data_inicio_param,
            calcular_taxa_ocupacao.data_fim_param,
            interval '1 day'
        )::date
    loop
        -- Para cada recorrência ativa que se aplica a este dia
        for rec_record in
            select
                ar.professor_id,
                ar.hora_inicio,
                ar.hora_fim,
                ar.duracao_slot_minutos
            from public.agendamento_recorrencia ar
            inner join public.professores p on p.id = ar.professor_id
            where p.empresa_id = calcular_taxa_ocupacao.empresa_id_param
            and ar.ativo = true
            and extract(dow from dia_record) = ar.dia_semana
            and ar.data_inicio <= dia_record
            and (ar.data_fim is null or ar.data_fim >= dia_record)
        loop
            -- Calcular quantos slots existem neste período (hora_inicio até hora_fim, com duracao_slot_minutos)
            hora_inicio_minutes := extract(hour from rec_record.hora_inicio)::int * 60 + extract(minute from rec_record.hora_inicio)::int;
            hora_fim_minutes := extract(hour from rec_record.hora_fim)::int * 60 + extract(minute from rec_record.hora_fim)::int;
            
            -- Calcular número de slots completos que cabem no intervalo
            if hora_fim_minutes > hora_inicio_minutes then
                slots_per_rec_per_dia := floor((hora_fim_minutes - hora_inicio_minutes)::numeric / rec_record.duracao_slot_minutos);
                total_slots := total_slots + slots_per_rec_per_dia;
                
                -- Verificar se há bloqueios que afetam esta recorrência neste dia
                for bloqueio_record in
                    select
                        ab.data_inicio,
                        ab.data_fim
                    from public.agendamento_bloqueios ab
                    where ab.empresa_id = calcular_taxa_ocupacao.empresa_id_param
                    and (ab.professor_id is null or ab.professor_id = rec_record.professor_id)
                    and ab.data_inicio::date <= dia_record
                    and ab.data_fim::date >= dia_record
                loop
                    -- Calcular interseção entre bloqueio e recorrência neste dia
                    declare
                        bloqueio_inicio_time time;
                        bloqueio_fim_time time;
                        intersect_start_minutes int;
                        intersect_end_minutes int;
                        blocked_count numeric;
                    begin
                        -- Extrair apenas a parte de tempo do bloqueio
                        bloqueio_inicio_time := bloqueio_record.data_inicio::time;
                        bloqueio_fim_time := bloqueio_record.data_fim::time;
                        
                        -- Calcular interseção de minutos
                        intersect_start_minutes := greatest(
                            hora_inicio_minutes,
                            extract(hour from bloqueio_inicio_time)::int * 60 + extract(minute from bloqueio_inicio_time)::int
                        );
                        intersect_end_minutes := least(
                            hora_fim_minutes,
                            extract(hour from bloqueio_fim_time)::int * 60 + extract(minute from bloqueio_fim_time)::int
                        );
                        
                        -- Calcular quantos slots foram bloqueados
                        if intersect_end_minutes > intersect_start_minutes then
                            blocked_count := ceil((intersect_end_minutes - intersect_start_minutes)::numeric / rec_record.duracao_slot_minutos);
                            slots_bloqueados := slots_bloqueados + blocked_count;
                        end if;
                    end;
                end loop;
            end if;
        end loop;
    end loop;

    -- Contar slots ocupados (agendamentos confirmados ou concluídos)
    select count(*)
    into slots_ocupados
    from public.agendamentos a
    inner join public.professores p on p.id = a.professor_id
    where p.empresa_id = calcular_taxa_ocupacao.empresa_id_param
    and a.status in ('confirmado', 'concluido')
    and date(a.data_inicio) >= calcular_taxa_ocupacao.data_inicio_param
    and date(a.data_inicio) <= calcular_taxa_ocupacao.data_fim_param;

    -- Calcular slots disponíveis (total - bloqueados)
    total_slots := total_slots - slots_bloqueados;

    -- Calcular taxa (0 a 1): ocupados / disponíveis
    if total_slots > 0 then
        taxa := slots_ocupados / total_slots;
    else
        taxa := 0;
    end if;

    return coalesce(taxa, 0);
end;
$$;

-- Add comment
comment on function public.calcular_taxa_ocupacao(uuid, date, date) is 'Calcula a taxa de ocupação de slots reais disponíveis no período. Expande recorrências para dias específicos, calcula slots por duração, subtrai bloqueios e divide slots ocupados (confirmados/concluídos) por total disponível. Retorna valor entre 0 e 1.';

