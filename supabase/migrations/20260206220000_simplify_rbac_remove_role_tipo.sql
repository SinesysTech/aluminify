-- Migration: Simplify RBAC - Remove RoleTipo dependency
-- Description:
--   1. Make papeis.tipo nullable (phase out)
--   2. Migrate is_admin flag based on papel tipo
--   3. Fix RLS policies with auth_rls_initplan performance issues
-- Date: 2026-02-06

-- =============================================
-- STEP 1: Make papeis.tipo nullable
-- =============================================
-- This allows us to phase out the tipo column gradually
-- New papeis will not require tipo

ALTER TABLE public.papeis ALTER COLUMN tipo DROP NOT NULL;

-- =============================================
-- STEP 2: Migrate is_admin flag to usuarios_empresas
-- =============================================
-- Users with admin-level papeis should have is_admin = true on their vinculo

-- First, let's update usuarios_empresas for usuarios with admin papeis
UPDATE public.usuarios_empresas ue
SET is_admin = true
WHERE ue.is_admin = false
  AND ue.papel_base = 'usuario'
  AND EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.papeis p ON u.papel_id = p.id
    WHERE u.id = ue.usuario_id
      AND u.empresa_id = ue.empresa_id
      AND p.tipo IN ('admin', 'professor_admin')
  );

-- For professor role, update those with professor_admin papel
UPDATE public.usuarios_empresas ue
SET is_admin = true
WHERE ue.is_admin = false
  AND ue.papel_base = 'professor'
  AND EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.papeis p ON u.papel_id = p.id
    WHERE u.id = ue.usuario_id
      AND u.empresa_id = ue.empresa_id
      AND p.tipo = 'professor_admin'
  );

-- =============================================
-- STEP 3: Fix RLS policies with auth_rls_initplan issues
-- =============================================
-- Replace auth.uid() with (select auth.uid()) for better performance
-- This prevents re-evaluation per row

-- papeis table
DROP POLICY IF EXISTS "Admins can create empresa roles" ON public.papeis;
CREATE POLICY "Admins can create empresa roles" ON public.papeis
    FOR INSERT TO authenticated
    WITH CHECK (
        empresa_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = papeis.empresa_id
            AND ue.is_admin = true
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "Admins can update empresa roles" ON public.papeis;
CREATE POLICY "Admins can update empresa roles" ON public.papeis
    FOR UPDATE TO authenticated
    USING (
        empresa_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = papeis.empresa_id
            AND ue.is_admin = true
            AND ue.ativo = true
        )
    )
    WITH CHECK (
        empresa_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = papeis.empresa_id
            AND ue.is_admin = true
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "Admins can delete empresa roles" ON public.papeis;
CREATE POLICY "Admins can delete empresa roles" ON public.papeis
    FOR DELETE TO authenticated
    USING (
        empresa_id IS NOT NULL AND
        is_system = false AND
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = papeis.empresa_id
            AND ue.is_admin = true
            AND ue.ativo = true
        )
    );

-- cronogramas table
DROP POLICY IF EXISTS "Aluno visualiza seus cronogramas" ON public.cronogramas;
CREATE POLICY "Aluno visualiza seus cronogramas" ON public.cronogramas
    FOR SELECT TO authenticated
    USING (aluno_id = (select auth.uid()));

DROP POLICY IF EXISTS "Aluno cria cronogramas na sua empresa" ON public.cronogramas;
CREATE POLICY "Aluno cria cronogramas na sua empresa" ON public.cronogramas
    FOR INSERT TO authenticated
    WITH CHECK (
        aluno_id = (select auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = cronogramas.empresa_id
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "Aluno atualiza seus cronogramas" ON public.cronogramas;
CREATE POLICY "Aluno atualiza seus cronogramas" ON public.cronogramas
    FOR UPDATE TO authenticated
    USING (aluno_id = (select auth.uid()))
    WITH CHECK (aluno_id = (select auth.uid()));

DROP POLICY IF EXISTS "Aluno deleta seus cronogramas" ON public.cronogramas;
CREATE POLICY "Aluno deleta seus cronogramas" ON public.cronogramas
    FOR DELETE TO authenticated
    USING (aluno_id = (select auth.uid()));

DROP POLICY IF EXISTS "Staff visualiza cronogramas da empresa" ON public.cronogramas;
CREATE POLICY "Staff visualiza cronogramas da empresa" ON public.cronogramas
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = cronogramas.empresa_id
            AND ue.papel_base IN ('professor', 'usuario')
            AND ue.ativo = true
        )
    );

-- progresso_flashcards table
DROP POLICY IF EXISTS "progresso_flashcards_aluno_select" ON public.progresso_flashcards;
CREATE POLICY "progresso_flashcards_aluno_select" ON public.progresso_flashcards
    FOR SELECT TO authenticated
    USING (aluno_id = (select auth.uid()));

DROP POLICY IF EXISTS "progresso_flashcards_aluno_insert" ON public.progresso_flashcards;
CREATE POLICY "progresso_flashcards_aluno_insert" ON public.progresso_flashcards
    FOR INSERT TO authenticated
    WITH CHECK (aluno_id = (select auth.uid()));

DROP POLICY IF EXISTS "progresso_flashcards_aluno_update" ON public.progresso_flashcards;
CREATE POLICY "progresso_flashcards_aluno_update" ON public.progresso_flashcards
    FOR UPDATE TO authenticated
    USING (aluno_id = (select auth.uid()))
    WITH CHECK (aluno_id = (select auth.uid()));

DROP POLICY IF EXISTS "progresso_flashcards_aluno_delete" ON public.progresso_flashcards;
CREATE POLICY "progresso_flashcards_aluno_delete" ON public.progresso_flashcards
    FOR DELETE TO authenticated
    USING (aluno_id = (select auth.uid()));

-- alunos_turmas table
DROP POLICY IF EXISTS "alunos_turmas_aluno_select" ON public.alunos_turmas;
CREATE POLICY "alunos_turmas_aluno_select" ON public.alunos_turmas
    FOR SELECT TO authenticated
    USING (aluno_id = (select auth.uid()));

-- cursos_disciplinas table
DROP POLICY IF EXISTS "Usuarios atualizam relacoes curso-disciplina" ON public.cursos_disciplinas;
CREATE POLICY "Usuarios atualizam relacoes curso-disciplina" ON public.cursos_disciplinas
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cursos c
            JOIN public.usuarios_empresas ue ON ue.empresa_id = c.empresa_id
            WHERE c.id = cursos_disciplinas.curso_id
            AND ue.usuario_id = (select auth.uid())
            AND ue.papel_base IN ('professor', 'usuario')
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "Usuarios criam relacoes curso-disciplina" ON public.cursos_disciplinas;
CREATE POLICY "Usuarios criam relacoes curso-disciplina" ON public.cursos_disciplinas
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cursos c
            JOIN public.usuarios_empresas ue ON ue.empresa_id = c.empresa_id
            WHERE c.id = cursos_disciplinas.curso_id
            AND ue.usuario_id = (select auth.uid())
            AND ue.papel_base IN ('professor', 'usuario')
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "Usuarios deletam relacoes curso-disciplina" ON public.cursos_disciplinas;
CREATE POLICY "Usuarios deletam relacoes curso-disciplina" ON public.cursos_disciplinas
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cursos c
            JOIN public.usuarios_empresas ue ON ue.empresa_id = c.empresa_id
            WHERE c.id = cursos_disciplinas.curso_id
            AND ue.usuario_id = (select auth.uid())
            AND ue.papel_base IN ('professor', 'usuario')
            AND ue.ativo = true
        )
    );

-- disciplinas table
DROP POLICY IF EXISTS "Disciplinas visiveis por empresa" ON public.disciplinas;
CREATE POLICY "Disciplinas visiveis por empresa" ON public.disciplinas
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = disciplinas.empresa_id
            AND ue.ativo = true
        )
    );

-- chat_conversations table
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can insert their own conversations" ON public.chat_conversations
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "chat_conversations_user_own" ON public.chat_conversations;
CREATE POLICY "chat_conversations_user_own" ON public.chat_conversations
    FOR ALL TO authenticated
    USING (user_id = (select auth.uid()));

-- chat_conversation_history table
DROP POLICY IF EXISTS "chat_conversation_history_user_own" ON public.chat_conversation_history;
CREATE POLICY "chat_conversation_history_user_own" ON public.chat_conversation_history
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_conversations cc
            WHERE cc.id = chat_conversation_history.conversation_id
            AND cc.user_id = (select auth.uid())
        )
    );

-- cronograma_semanas_dias table
DROP POLICY IF EXISTS "Aluno gerencia semanas dias do cronograma" ON public.cronograma_semanas_dias;
CREATE POLICY "Aluno gerencia semanas dias do cronograma" ON public.cronograma_semanas_dias
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cronogramas c
            WHERE c.id = cronograma_semanas_dias.cronograma_id
            AND c.aluno_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Semanas dias visiveis via cronograma" ON public.cronograma_semanas_dias;
CREATE POLICY "Semanas dias visiveis via cronograma" ON public.cronograma_semanas_dias
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cronogramas c
            WHERE c.id = cronograma_semanas_dias.cronograma_id
            AND (
                c.aluno_id = (select auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.usuarios_empresas ue
                    WHERE ue.usuario_id = (select auth.uid())
                    AND ue.empresa_id = c.empresa_id
                    AND ue.papel_base IN ('professor', 'usuario')
                    AND ue.ativo = true
                )
            )
        )
    );

-- agendamentos table
DROP POLICY IF EXISTS "agendamentos_select_admin" ON public.agendamentos;
CREATE POLICY "agendamentos_select_admin" ON public.agendamentos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = agendamentos.empresa_id
            AND ue.is_admin = true
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "agendamentos_update_admin" ON public.agendamentos;
CREATE POLICY "agendamentos_update_admin" ON public.agendamentos
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = agendamentos.empresa_id
            AND ue.is_admin = true
            AND ue.ativo = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = agendamentos.empresa_id
            AND ue.is_admin = true
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "agendamentos_select" ON public.agendamentos;
CREATE POLICY "agendamentos_select" ON public.agendamentos
    FOR SELECT TO authenticated
    USING (
        aluno_id = (select auth.uid()) OR professor_id = (select auth.uid())
    );

DROP POLICY IF EXISTS "agendamentos_insert" ON public.agendamentos;
CREATE POLICY "agendamentos_insert" ON public.agendamentos
    FOR INSERT TO authenticated
    WITH CHECK (
        aluno_id = (select auth.uid()) OR professor_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = agendamentos.empresa_id
            AND ue.is_admin = true
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "agendamentos_update" ON public.agendamentos;
CREATE POLICY "agendamentos_update" ON public.agendamentos
    FOR UPDATE TO authenticated
    USING (aluno_id = (select auth.uid()) OR professor_id = (select auth.uid()))
    WITH CHECK (aluno_id = (select auth.uid()) OR professor_id = (select auth.uid()));

-- agendamento_bloqueios table
DROP POLICY IF EXISTS "Admins podem gerenciar bloqueios da empresa" ON public.agendamento_bloqueios;
CREATE POLICY "Admins podem gerenciar bloqueios da empresa" ON public.agendamento_bloqueios
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = agendamento_bloqueios.empresa_id
            AND ue.is_admin = true
            AND ue.ativo = true
        )
    );

-- agendamento_configuracoes table
DROP POLICY IF EXISTS "agendamento_configuracoes_all" ON public.agendamento_configuracoes;
CREATE POLICY "agendamento_configuracoes_all" ON public.agendamento_configuracoes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = agendamento_configuracoes.empresa_id
            AND ue.is_admin = true
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "agendamento_configuracoes_select" ON public.agendamento_configuracoes;
CREATE POLICY "agendamento_configuracoes_select" ON public.agendamento_configuracoes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = agendamento_configuracoes.empresa_id
            AND ue.ativo = true
        )
    );

-- progresso_atividades table
DROP POLICY IF EXISTS "progresso_atividades_all" ON public.progresso_atividades;
CREATE POLICY "progresso_atividades_all" ON public.progresso_atividades
    FOR ALL TO authenticated
    USING (aluno_id = (select auth.uid()));

-- sessoes_estudo table
DROP POLICY IF EXISTS "sessoes_estudo_all" ON public.sessoes_estudo;
CREATE POLICY "sessoes_estudo_all" ON public.sessoes_estudo
    FOR ALL TO authenticated
    USING (aluno_id = (select auth.uid()));

DROP POLICY IF EXISTS "sessoes_estudo_select_empresa" ON public.sessoes_estudo;
CREATE POLICY "sessoes_estudo_select_empresa" ON public.sessoes_estudo
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = sessoes_estudo.empresa_id
            AND ue.papel_base IN ('professor', 'usuario')
            AND ue.ativo = true
        )
    );

-- aulas_concluidas table
DROP POLICY IF EXISTS "aulas_concluidas_all" ON public.aulas_concluidas;
CREATE POLICY "aulas_concluidas_all" ON public.aulas_concluidas
    FOR ALL TO authenticated
    USING (aluno_id = (select auth.uid()));

-- agendamento_disponibilidade table
DROP POLICY IF EXISTS "agendamento_disponibilidade_all" ON public.agendamento_disponibilidade;
CREATE POLICY "agendamento_disponibilidade_all" ON public.agendamento_disponibilidade
    FOR ALL TO authenticated
    USING (professor_id = (select auth.uid()));

DROP POLICY IF EXISTS "agendamento_disponibilidade_select" ON public.agendamento_disponibilidade;
CREATE POLICY "agendamento_disponibilidade_select" ON public.agendamento_disponibilidade
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = agendamento_disponibilidade.empresa_id
            AND ue.ativo = true
        )
    );

-- curso_modulos table
DROP POLICY IF EXISTS "curso_modulos_select" ON public.curso_modulos;
CREATE POLICY "curso_modulos_select" ON public.curso_modulos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cursos c
            JOIN public.usuarios_empresas ue ON ue.empresa_id = c.empresa_id
            WHERE c.id = curso_modulos.curso_id
            AND ue.usuario_id = (select auth.uid())
            AND ue.ativo = true
        )
    );

-- matriculas table
DROP POLICY IF EXISTS "Usuarios atualizam matriculas da empresa" ON public.matriculas;
CREATE POLICY "Usuarios atualizam matriculas da empresa" ON public.matriculas
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = matriculas.empresa_id
            AND ue.papel_base IN ('professor', 'usuario')
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "Usuarios criam matriculas da empresa" ON public.matriculas;
CREATE POLICY "Usuarios criam matriculas da empresa" ON public.matriculas
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = matriculas.empresa_id
            AND ue.papel_base IN ('professor', 'usuario')
            AND ue.ativo = true
        )
    );

DROP POLICY IF EXISTS "Usuarios deletam matriculas da empresa" ON public.matriculas;
CREATE POLICY "Usuarios deletam matriculas da empresa" ON public.matriculas
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios_empresas ue
            WHERE ue.usuario_id = (select auth.uid())
            AND ue.empresa_id = matriculas.empresa_id
            AND ue.papel_base IN ('professor', 'usuario')
            AND ue.ativo = true
        )
    );

-- cronograma_itens table
DROP POLICY IF EXISTS "Aluno gerencia itens do seu cronograma" ON public.cronograma_itens;
CREATE POLICY "Aluno gerencia itens do seu cronograma" ON public.cronograma_itens
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cronogramas c
            WHERE c.id = cronograma_itens.cronograma_id
            AND c.aluno_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Itens visiveis via cronograma" ON public.cronograma_itens;
CREATE POLICY "Itens visiveis via cronograma" ON public.cronograma_itens
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cronogramas c
            WHERE c.id = cronograma_itens.cronograma_id
            AND (
                c.aluno_id = (select auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.usuarios_empresas ue
                    WHERE ue.usuario_id = (select auth.uid())
                    AND ue.empresa_id = c.empresa_id
                    AND ue.papel_base IN ('professor', 'usuario')
                    AND ue.ativo = true
                )
            )
        )
    );

-- curso_plantao_quotas table
DROP POLICY IF EXISTS "curso_plantao_quotas_select" ON public.curso_plantao_quotas;
CREATE POLICY "curso_plantao_quotas_select" ON public.curso_plantao_quotas
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cursos c
            JOIN public.usuarios_empresas ue ON ue.empresa_id = c.empresa_id
            WHERE c.id = curso_plantao_quotas.curso_id
            AND ue.usuario_id = (select auth.uid())
            AND ue.ativo = true
        )
    );

-- agendamento_notificacoes table
DROP POLICY IF EXISTS "agendamento_notificacoes_all" ON public.agendamento_notificacoes;
CREATE POLICY "agendamento_notificacoes_all" ON public.agendamento_notificacoes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.agendamentos a
            WHERE a.id = agendamento_notificacoes.agendamento_id
            AND (a.aluno_id = (select auth.uid()) OR a.professor_id = (select auth.uid()))
        )
    );

DROP POLICY IF EXISTS "agendamento_notificacoes_select" ON public.agendamento_notificacoes;
CREATE POLICY "agendamento_notificacoes_select" ON public.agendamento_notificacoes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.agendamentos a
            WHERE a.id = agendamento_notificacoes.agendamento_id
            AND (a.aluno_id = (select auth.uid()) OR a.professor_id = (select auth.uid()))
        )
    );

-- =============================================
-- STEP 4: Add comment explaining new model
-- =============================================
COMMENT ON COLUMN public.papeis.tipo IS 'DEPRECATED: Role type is being phased out. Use usuarios_empresas.is_admin for admin checks instead.';
