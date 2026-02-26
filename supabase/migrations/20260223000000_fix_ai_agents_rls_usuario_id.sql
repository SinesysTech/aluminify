-- Migration: Fix ai_agents RLS policy for students
-- Description: The SELECT policy referenced alunos_cursos.aluno_id which does not exist.
--              The correct column is usuario_id (unified user model).
--              This caused students to never see AI agents, resulting in
--              "Nenhum assistente configurado para esta empresa" error.
-- Date: 2026-02-23

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view active agents from their empresa" ON public.ai_agents;

-- Recreate with the correct column name (usuario_id instead of aluno_id)
CREATE POLICY "Users can view active agents from their empresa"
    ON public.ai_agents
    FOR SELECT
    TO authenticated
    USING (
        is_active = true
        AND (
            -- Staff/admins from the empresa (via usuarios_empresas)
            empresa_id IN (
                SELECT ue.empresa_id
                FROM public.usuarios_empresas ue
                WHERE ue.usuario_id = auth.uid()
                  AND ue.ativo = true
            )
            OR
            -- Students enrolled in courses from the empresa
            empresa_id IN (
                SELECT c.empresa_id
                FROM public.alunos_cursos ac
                JOIN public.cursos c ON ac.curso_id = c.id
                WHERE ac.usuario_id = auth.uid()
            )
            OR
            -- Superadmins can see all
            EXISTS (
                SELECT 1 FROM auth.users
                WHERE id = auth.uid()
                AND raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );
