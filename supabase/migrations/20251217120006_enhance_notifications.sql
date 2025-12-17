-- Migration: Enhance notifications system
-- Description: Adiciona novos tipos de notificações e triggers para bloqueios e recorrências
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Alterar constraint de tipo em agendamento_notificacoes para incluir novos tipos
alter table public.agendamento_notificacoes
drop constraint if exists agendamento_notificacoes_tipo_check;

alter table public.agendamento_notificacoes
add constraint agendamento_notificacoes_tipo_check
    check (tipo in (
        'criacao',
        'confirmacao',
        'cancelamento',
        'lembrete',
        'alteracao',
        'rejeicao',
        'bloqueio_criado',
        'recorrencia_alterada',
        'substituicao_solicitada'
    ));

-- 2. Criar trigger para notificar alunos quando bloqueio cancela agendamento existente
create or replace function public.notify_bloqueio_afeta_agendamentos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    agendamento_record record;
begin
    -- Se o bloqueio afeta um professor específico, notificar sobre agendamentos desse professor
    -- Se o bloqueio é da empresa (professor_id null), notificar sobre todos os agendamentos da empresa
    if new.professor_id is not null then
        -- Bloqueio de professor específico
        for agendamento_record in
            select a.id, a.aluno_id, a.professor_id
            from public.agendamentos a
            where a.professor_id = new.professor_id
            and a.status in ('pendente', 'confirmado')
            and a.data_inicio >= new.data_inicio
            and a.data_fim <= new.data_fim
        loop
            -- Criar notificação para o aluno
            insert into public.agendamento_notificacoes (
                agendamento_id,
                tipo,
                destinatario_id,
                enviado,
                created_at
            ) values (
                agendamento_record.id,
                'bloqueio_criado',
                agendamento_record.aluno_id,
                false,
                now()
            );
        end loop;
    else
        -- Bloqueio da empresa - notificar todos os agendamentos afetados
        for agendamento_record in
            select a.id, a.aluno_id, a.professor_id
            from public.agendamentos a
            inner join public.professores p on p.id = a.professor_id
            where p.empresa_id = new.empresa_id
            and a.status in ('pendente', 'confirmado')
            and a.data_inicio >= new.data_inicio
            and a.data_fim <= new.data_fim
        loop
            -- Criar notificação para o aluno
            insert into public.agendamento_notificacoes (
                agendamento_id,
                tipo,
                destinatario_id,
                enviado,
                created_at
            ) values (
                agendamento_record.id,
                'bloqueio_criado',
                agendamento_record.aluno_id,
                false,
                now()
            );
        end loop;
    end if;

    return new;
end;
$$;

create trigger trigger_notify_bloqueio_agendamentos
    after insert on public.agendamento_bloqueios
    for each row
    execute function public.notify_bloqueio_afeta_agendamentos();

-- 3. Criar trigger para notificar quando recorrência é alterada (opcional - pode ser usado para notificar alunos sobre mudanças de disponibilidade)
create or replace function public.notify_recorrencia_alterada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- Notificar alunos com agendamentos pendentes que podem ser afetados
    -- Esta é uma notificação informativa, não crítica
    -- Pode ser implementada no futuro se necessário
    
    return new;
end;
$$;

-- 4. Adicionar comentários
comment on function public.notify_bloqueio_afeta_agendamentos() is 'Notifica alunos quando um bloqueio de agenda afeta seus agendamentos existentes.';
comment on function public.notify_recorrencia_alterada() is 'Notifica sobre alterações em padrões de recorrência (reservado para uso futuro).';

