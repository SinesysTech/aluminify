-- =============================================================================
-- ROLLBACK: RLS Policy Consolidation
-- Purpose: Restores all consolidated policies to their pre-refactoring state.
--          Run this if any tenant isolation issues are detected after migration.
--
-- How to use:
--   1. Run individual sections for targeted rollback of specific tables
--   2. Or run the entire script to rollback everything
--   3. After rollback, run validate_rls_refactoring.sql to verify
--
-- Note: This does NOT rollback Phase 1 (helper functions) or Phase 3 (indexes)
--       as those are additive changes with no behavioral impact.
-- =============================================================================

BEGIN;

-- =========================================================================
-- ROLLBACK: usuarios (4 → 6)
-- =========================================================================

DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;

CREATE POLICY "Users can view own profile"
    ON public.usuarios FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can view empresa colleagues"
    ON public.usuarios FOR SELECT TO authenticated
    USING (
        (id = (SELECT auth.uid()))
        OR (empresa_id = get_user_empresa_id())
        OR EXISTS (
            SELECT 1
            FROM alunos_cursos ac
            JOIN cursos c ON c.id = ac.curso_id
            WHERE ac.usuario_id = usuarios.id
              AND c.empresa_id = get_user_empresa_id()
        )
    );

CREATE POLICY "Users can update own profile"
    ON public.usuarios FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update users"
    ON public.usuarios FOR UPDATE TO authenticated
    USING (empresa_id = get_auth_user_empresa_id());

-- =========================================================================
-- ROLLBACK: materiais_curso (4 → 6)
-- =========================================================================

DROP POLICY IF EXISTS "materiais_curso_select" ON public.materiais_curso;

CREATE POLICY "Acesso a materiais apenas para matriculados"
    ON public.materiais_curso FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM matriculas m
        WHERE m.curso_id = materiais_curso.curso_id
          AND m.usuario_id = auth.uid()
          AND m.ativo = true
    ));

CREATE POLICY "Materiais visiveis por empresa"
    ON public.materiais_curso FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id() OR aluno_matriculado_empresa(empresa_id));

CREATE POLICY "materiais_curso_professor_select"
    ON public.materiais_curso FOR SELECT TO authenticated
    USING ((is_professor() AND empresa_id = get_user_empresa_id()) OR aluno_matriculado_empresa(empresa_id));

-- =========================================================================
-- ROLLBACK: agendamento_bloqueios (4 → 12)
-- =========================================================================

DROP POLICY IF EXISTS "agendamento_bloqueios_select" ON public.agendamento_bloqueios;
DROP POLICY IF EXISTS "agendamento_bloqueios_insert" ON public.agendamento_bloqueios;
DROP POLICY IF EXISTS "agendamento_bloqueios_update" ON public.agendamento_bloqueios;
DROP POLICY IF EXISTS "agendamento_bloqueios_delete" ON public.agendamento_bloqueios;

-- SELECT (3)
CREATE POLICY "Admins podem ver todos bloqueios da empresa"
    ON public.agendamento_bloqueios FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id() AND is_empresa_admin());

CREATE POLICY "Alunos podem ver bloqueios para agendamento"
    ON public.agendamento_bloqueios FOR SELECT TO authenticated
    USING (empresa_id IN (
        SELECT DISTINCT c.empresa_id
        FROM alunos_cursos ac JOIN cursos c ON c.id = ac.curso_id
        WHERE ac.usuario_id = (SELECT auth.uid())
    ));

CREATE POLICY "Professores veem bloqueios relevantes"
    ON public.agendamento_bloqueios FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id() AND (professor_id IS NULL OR professor_id = (SELECT auth.uid())));

-- INSERT (3)
CREATE POLICY "Admins podem criar bloqueios da empresa"
    ON public.agendamento_bloqueios FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id() AND professor_id IS NULL AND is_empresa_admin(auth.uid(), empresa_id));

CREATE POLICY "Admins podem criar bloqueios para professores"
    ON public.agendamento_bloqueios FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id() AND is_empresa_admin() AND criado_por = (SELECT auth.uid()));

CREATE POLICY "Professores podem criar bloqueios próprios"
    ON public.agendamento_bloqueios FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id() AND (professor_id IS NULL OR professor_id = (SELECT auth.uid())) AND criado_por = (SELECT auth.uid()));

-- UPDATE (3)
CREATE POLICY "Admins podem atualizar bloqueios da empresa"
    ON public.agendamento_bloqueios FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id() AND professor_id IS NULL AND is_empresa_admin(auth.uid(), empresa_id))
    WITH CHECK (empresa_id = get_user_empresa_id() AND professor_id IS NULL AND is_empresa_admin(auth.uid(), empresa_id));

CREATE POLICY "Admins podem atualizar bloqueios de professores"
    ON public.agendamento_bloqueios FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id() AND is_empresa_admin())
    WITH CHECK (empresa_id = get_user_empresa_id() AND is_empresa_admin());

CREATE POLICY "Professores podem atualizar bloqueios próprios"
    ON public.agendamento_bloqueios FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id() AND professor_id = (SELECT auth.uid()))
    WITH CHECK (empresa_id = get_user_empresa_id() AND professor_id = (SELECT auth.uid()));

-- DELETE (3)
CREATE POLICY "Admins podem deletar bloqueios da empresa"
    ON public.agendamento_bloqueios FOR DELETE TO authenticated
    USING (empresa_id = get_user_empresa_id() AND professor_id IS NULL AND is_empresa_admin(auth.uid(), empresa_id));

CREATE POLICY "Admins podem deletar bloqueios de professores"
    ON public.agendamento_bloqueios FOR DELETE TO authenticated
    USING (empresa_id = get_user_empresa_id() AND is_empresa_admin());

CREATE POLICY "Professores podem deletar bloqueios próprios"
    ON public.agendamento_bloqueios FOR DELETE TO authenticated
    USING (empresa_id = get_user_empresa_id() AND professor_id = (SELECT auth.uid()));

-- =========================================================================
-- ROLLBACK: agendamento_recorrencia (4 → 9)
-- =========================================================================

DROP POLICY IF EXISTS "agendamento_recorrencia_select" ON public.agendamento_recorrencia;
DROP POLICY IF EXISTS "agendamento_recorrencia_insert" ON public.agendamento_recorrencia;
DROP POLICY IF EXISTS "agendamento_recorrencia_update" ON public.agendamento_recorrencia;
DROP POLICY IF EXISTS "agendamento_recorrencia_delete" ON public.agendamento_recorrencia;

CREATE POLICY "Admins podem ver recorrências da empresa"
    ON public.agendamento_recorrencia FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id() AND is_empresa_admin());

CREATE POLICY "Alunos podem ver recorrências ativas"
    ON public.agendamento_recorrencia FOR SELECT TO authenticated
    USING (ativo = true AND (data_fim IS NULL OR data_fim >= CURRENT_DATE) AND data_inicio <= CURRENT_DATE);

CREATE POLICY "Professores veem suas recorrências"
    ON public.agendamento_recorrencia FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = professor_id AND empresa_id = get_user_empresa_id());

CREATE POLICY "Admins podem criar recorrências para professores"
    ON public.agendamento_recorrencia FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id() AND is_empresa_admin());

CREATE POLICY "Professores podem criar recorrências"
    ON public.agendamento_recorrencia FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = professor_id AND empresa_id = get_user_empresa_id());

CREATE POLICY "Admins podem atualizar recorrências de professores"
    ON public.agendamento_recorrencia FOR UPDATE TO authenticated
    USING (empresa_id = get_user_empresa_id() AND is_empresa_admin())
    WITH CHECK (empresa_id = get_user_empresa_id() AND is_empresa_admin());

CREATE POLICY "Professores podem atualizar recorrências"
    ON public.agendamento_recorrencia FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = professor_id AND empresa_id = get_user_empresa_id())
    WITH CHECK ((SELECT auth.uid()) = professor_id AND empresa_id = get_user_empresa_id());

CREATE POLICY "Admins podem deletar recorrências de professores"
    ON public.agendamento_recorrencia FOR DELETE TO authenticated
    USING (empresa_id = get_user_empresa_id() AND is_empresa_admin());

CREATE POLICY "Professores podem deletar recorrências"
    ON public.agendamento_recorrencia FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = professor_id AND empresa_id = get_user_empresa_id());

-- =========================================================================
-- ROLLBACK: agendamentos (3 → 8)
-- =========================================================================

DROP POLICY IF EXISTS "agendamentos_select" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_update" ON public.agendamentos;

CREATE POLICY "Agendamentos visiveis por empresa"
    ON public.agendamentos FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id() OR aluno_id = auth.uid() OR professor_id = auth.uid());

CREATE POLICY "Professors can view own appointments"
    ON public.agendamentos FOR SELECT TO authenticated
    USING (auth.uid() = professor_id);

CREATE POLICY "Students can view own appointments"
    ON public.agendamentos FOR SELECT TO authenticated
    USING (auth.uid() = aluno_id);

CREATE POLICY "Criar agendamentos na empresa"
    ON public.agendamentos FOR INSERT TO authenticated
    WITH CHECK (empresa_id = get_user_empresa_id() OR aluno_matriculado_empresa(empresa_id));

CREATE POLICY "Students can create appointments"
    ON public.agendamentos FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Atualizar agendamentos proprios"
    ON public.agendamentos FOR UPDATE TO authenticated
    USING (aluno_id = auth.uid() OR professor_id = auth.uid() OR empresa_id = get_user_empresa_id())
    WITH CHECK (aluno_id = auth.uid() OR professor_id = auth.uid() OR empresa_id = get_user_empresa_id());

CREATE POLICY "Professors can update own appointments"
    ON public.agendamentos FOR UPDATE TO authenticated
    USING (auth.uid() = professor_id);

CREATE POLICY "Students can update own appointments"
    ON public.agendamentos FOR UPDATE TO authenticated
    USING (auth.uid() = aluno_id AND status = 'pendente');

-- =========================================================================
-- ROLLBACK: api_keys (4 → 7)
-- =========================================================================

DROP POLICY IF EXISTS "api_keys_delete" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_insert" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_update" ON public.api_keys;

CREATE POLICY "Deletar API keys proprias"
    ON public.api_keys FOR DELETE TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "api_keys_delete_empresa"
    ON public.api_keys FOR DELETE TO authenticated
    USING (created_by = (SELECT auth.uid()) OR (empresa_id = get_user_empresa_id() AND is_empresa_admin()));

CREATE POLICY "Professores criam API keys"
    ON public.api_keys FOR INSERT TO authenticated
    WITH CHECK (is_professor());

CREATE POLICY "api_keys_insert_empresa"
    ON public.api_keys FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()) AND (empresa_id IS NULL OR empresa_id = get_user_empresa_id()));

CREATE POLICY "Atualizar API keys proprias"
    ON public.api_keys FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "api_keys_update_empresa"
    ON public.api_keys FOR UPDATE TO authenticated
    USING (created_by = (SELECT auth.uid()) OR (empresa_id = get_user_empresa_id() AND is_empresa_admin()))
    WITH CHECK (created_by = (SELECT auth.uid()) OR (empresa_id = get_user_empresa_id() AND is_empresa_admin()));

-- =========================================================================
-- ROLLBACK: agendamento_configuracoes (2 → 6)
-- =========================================================================

DROP POLICY IF EXISTS "agendamento_configuracoes_all" ON public.agendamento_configuracoes;
DROP POLICY IF EXISTS "agendamento_configuracoes_select" ON public.agendamento_configuracoes;

CREATE POLICY "Admins podem gerenciar config de professores"
    ON public.agendamento_configuracoes FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM usuarios u WHERE u.id = agendamento_configuracoes.professor_id AND u.empresa_id = get_user_empresa_id() AND u.deleted_at IS NULL) AND is_empresa_admin());

CREATE POLICY "Professor gerencia suas configuracoes"
    ON public.agendamento_configuracoes FOR ALL TO authenticated
    USING (professor_id = auth.uid() OR empresa_id = get_user_empresa_id())
    WITH CHECK (professor_id = auth.uid());

CREATE POLICY "Professors can manage their own config"
    ON public.agendamento_configuracoes FOR ALL TO authenticated
    USING (auth.uid() = professor_id);

CREATE POLICY "Admins podem ver config de professores"
    ON public.agendamento_configuracoes FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM usuarios u WHERE u.id = agendamento_configuracoes.professor_id AND u.empresa_id = get_user_empresa_id() AND u.deleted_at IS NULL) AND is_empresa_admin());

CREATE POLICY "Configuracoes visiveis por empresa"
    ON public.agendamento_configuracoes FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id() OR professor_id = auth.uid());

CREATE POLICY "Professors can view their own config"
    ON public.agendamento_configuracoes FOR SELECT TO authenticated
    USING (auth.uid() = professor_id);

-- =========================================================================
-- ROLLBACK: progresso_atividades (2 → 5)
-- =========================================================================

DROP POLICY IF EXISTS "progresso_atividades_all" ON public.progresso_atividades;
DROP POLICY IF EXISTS "progresso_atividades_professor_select" ON public.progresso_atividades;

CREATE POLICY "Aluno gerencia seu progresso atividades"
    ON public.progresso_atividades FOR ALL TO authenticated
    USING (usuario_id = auth.uid() OR empresa_id = get_user_empresa_id())
    WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Aluno atualiza seu progresso"
    ON public.progresso_atividades FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Aluno vê seu progresso"
    ON public.progresso_atividades FOR SELECT TO authenticated
    USING (auth.uid() = usuario_id);

CREATE POLICY "progresso_atividades_professor_select"
    ON public.progresso_atividades FOR SELECT TO authenticated
    USING (is_professor() AND empresa_id = get_user_empresa_id() AND EXISTS (
        SELECT 1 FROM atividades a JOIN modulos m ON m.id = a.modulo_id JOIN frentes f ON f.id = m.frente_id
        WHERE a.id = progresso_atividades.atividade_id AND is_professor_da_disciplina(f.disciplina_id)
    ));

CREATE POLICY "Aluno edita seu progresso"
    ON public.progresso_atividades FOR UPDATE TO authenticated
    USING (auth.uid() = usuario_id);

-- =========================================================================
-- ROLLBACK: sessoes_estudo (2 → 3)
-- =========================================================================

DROP POLICY IF EXISTS "sessoes_estudo_all" ON public.sessoes_estudo;
DROP POLICY IF EXISTS "sessoes_estudo_select_empresa" ON public.sessoes_estudo;

CREATE POLICY "Aluno gerencia suas sessoes"
    ON public.sessoes_estudo FOR ALL TO authenticated
    USING (usuario_id = auth.uid() OR empresa_id = get_user_empresa_id())
    WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Sessoes visiveis por empresa"
    ON public.sessoes_estudo FOR SELECT TO authenticated
    USING (usuario_id = auth.uid() OR empresa_id = get_user_empresa_id());

CREATE POLICY "sessoes_estudo_professor_select"
    ON public.sessoes_estudo FOR SELECT TO authenticated
    USING (is_professor() AND empresa_id = get_user_empresa_id() AND (is_professor_da_disciplina(disciplina_id) OR (frente_id IS NOT NULL AND professor_tem_acesso_frente(frente_id))));

-- =========================================================================
-- ROLLBACK: aulas_concluidas (2 → 3)
-- =========================================================================

DROP POLICY IF EXISTS "aulas_concluidas_all" ON public.aulas_concluidas;
DROP POLICY IF EXISTS "aulas_concluidas_professor_select" ON public.aulas_concluidas;

CREATE POLICY "Aluno gerencia aulas concluídas"
    ON public.aulas_concluidas FOR ALL TO authenticated
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Aluno gerencia suas aulas concluidas"
    ON public.aulas_concluidas FOR ALL TO authenticated
    USING (usuario_id = auth.uid() OR empresa_id = get_user_empresa_id())
    WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "aulas_concluidas_professor_select"
    ON public.aulas_concluidas FOR ALL TO authenticated
    USING (is_professor() AND empresa_id = get_user_empresa_id() AND EXISTS (
        SELECT 1 FROM aulas au JOIN modulos m ON m.id = au.modulo_id JOIN frentes f ON f.id = m.frente_id
        WHERE au.id = aulas_concluidas.aula_id AND is_professor_da_disciplina(f.disciplina_id)
    ));

-- =========================================================================
-- ROLLBACK: agendamento_disponibilidade (2 → 3)
-- =========================================================================

DROP POLICY IF EXISTS "agendamento_disponibilidade_all" ON public.agendamento_disponibilidade;
DROP POLICY IF EXISTS "agendamento_disponibilidade_select" ON public.agendamento_disponibilidade;

CREATE POLICY "Professor gerencia sua disponibilidade"
    ON public.agendamento_disponibilidade FOR ALL TO authenticated
    USING (professor_id = auth.uid() OR empresa_id = get_user_empresa_id())
    WITH CHECK (professor_id = auth.uid());

CREATE POLICY "Professors can manage own availability"
    ON public.agendamento_disponibilidade FOR ALL TO authenticated
    USING (auth.uid() = professor_id);

CREATE POLICY "Disponibilidade visivel por empresa"
    ON public.agendamento_disponibilidade FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id() OR aluno_matriculado_empresa(empresa_id) OR professor_id = auth.uid());

-- =========================================================================
-- ROLLBACK: agendamento_notificacoes (2 → 3)
-- =========================================================================

DROP POLICY IF EXISTS "agendamento_notificacoes_all" ON public.agendamento_notificacoes;
DROP POLICY IF EXISTS "agendamento_notificacoes_select" ON public.agendamento_notificacoes;

CREATE POLICY "Sistema gerencia notificacoes"
    ON public.agendamento_notificacoes FOR ALL TO authenticated
    USING (destinatario_id = auth.uid() OR empresa_id = get_user_empresa_id())
    WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Notificacoes visiveis por empresa"
    ON public.agendamento_notificacoes FOR SELECT TO authenticated
    USING (empresa_id = get_user_empresa_id() OR destinatario_id = auth.uid());

CREATE POLICY "Users can view their own notifications"
    ON public.agendamento_notificacoes FOR SELECT TO authenticated
    USING (auth.uid() = destinatario_id);

-- =========================================================================
-- ROLLBACK: papeis (4 → 6)
-- =========================================================================

DROP POLICY IF EXISTS "papeis_select" ON public.papeis;

CREATE POLICY "Empresa roles visible to empresa users"
    ON public.papeis FOR SELECT TO authenticated
    USING (empresa_id IS NOT NULL AND user_belongs_to_empresa(empresa_id));

CREATE POLICY "System roles visible to all"
    ON public.papeis FOR SELECT TO authenticated
    USING (is_system = true AND empresa_id IS NULL);

CREATE POLICY "Users can view own role"
    ON public.papeis FOR SELECT TO authenticated
    USING (id IN (SELECT u.papel_id FROM usuarios u WHERE u.id = auth.uid()));

-- =========================================================================
-- ROLLBACK: matriculas (4 → 5)
-- =========================================================================

DROP POLICY IF EXISTS "matriculas_select" ON public.matriculas;

CREATE POLICY "Aluno vê suas próprias matrículas"
    ON public.matriculas FOR SELECT TO authenticated
    USING (auth.uid() = usuario_id);

CREATE POLICY "Matriculas visiveis por empresa"
    ON public.matriculas FOR SELECT TO authenticated
    USING (
        usuario_id = auth.uid()
        OR empresa_id = get_user_empresa_id()
        OR EXISTS (SELECT 1 FROM cursos c WHERE c.id = matriculas.curso_id AND c.empresa_id = get_user_empresa_id())
    );

COMMIT;
