-- Migration: Create shared calendar view
-- Description: View para visualização compartilhada de agendamentos entre professores da mesma empresa
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Criar view v_agendamentos_empresa
create or replace view public.v_agendamentos_empresa as
select
    a.id,
    a.professor_id,
    p.nome_completo as professor_nome,
    p.foto_url as professor_foto,
    a.aluno_id,
    al.nome_completo as aluno_nome,
    al.email as aluno_email,
    a.data_inicio,
    a.data_fim,
    a.status,
    a.link_reuniao,
    a.observacoes,
    a.created_at,
    a.updated_at,
    p.empresa_id
from public.agendamentos a
inner join public.professores p on p.id = a.professor_id
left join public.alunos al on al.id = a.aluno_id
where p.empresa_id = public.get_user_empresa_id();

-- 2. Adicionar comentário na view
comment on view public.v_agendamentos_empresa is 'View agregada de agendamentos de todos os professores da mesma empresa. Filtrada automaticamente por empresa_id via RLS.';

-- 3. Habilitar RLS na view (via tabelas subjacentes)
-- A view herda as políticas RLS das tabelas agendamentos, professores e alunos

-- 4. Criar policy para acesso à view
-- Professores veem apenas agendamentos da própria empresa
create policy "Professores veem agendamentos da empresa"
    on public.v_agendamentos_empresa
    for select
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
    );

