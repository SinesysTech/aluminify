-- Migration: Enhance agendamentos RLS policies for security
-- Description: Add stricter RLS policies to prevent unauthorized access/modification
-- Date: 2026-01-17

-- =============================================
-- Drop existing policies and recreate with better security
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Professors can view own appointments" ON agendamentos;
DROP POLICY IF EXISTS "Students can view own appointments" ON agendamentos;
DROP POLICY IF EXISTS "Students can create appointments" ON agendamentos;
DROP POLICY IF EXISTS "Professors can update own appointments" ON agendamentos;
DROP POLICY IF EXISTS "Students can update own appointments" ON agendamentos;

-- =============================================
-- SELECT policies
-- =============================================

-- Professor can view appointments where they are the professor
CREATE POLICY "agendamentos_select_professor"
    ON agendamentos
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = professor_id
        OR
        -- Superadmin can view all
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- Student can view appointments where they are the student
CREATE POLICY "agendamentos_select_aluno"
    ON agendamentos
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = aluno_id
    );

-- =============================================
-- INSERT policies
-- =============================================

-- Students can create appointments (requesting)
CREATE POLICY "agendamentos_insert_aluno"
    ON agendamentos
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = aluno_id
    );

-- =============================================
-- UPDATE policies - Enhanced security
-- =============================================

-- Professor can update only their own appointments (confirm/reject/cancel)
CREATE POLICY "agendamentos_update_professor"
    ON agendamentos
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = professor_id
    )
    WITH CHECK (
        auth.uid() = professor_id
    );

-- Student can update only their own appointments (cancel only)
-- Only for pending or confirmed status
CREATE POLICY "agendamentos_update_aluno"
    ON agendamentos
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = aluno_id
        AND status IN ('pendente', 'confirmado')
    )
    WITH CHECK (
        auth.uid() = aluno_id
        AND status = 'cancelado' -- Student can only change to cancelled
    );

-- =============================================
-- DELETE policies - Prevent direct deletion
-- =============================================

-- No one can delete agendamentos directly (use status = 'cancelado' instead)
-- Only superadmin can delete for data cleanup
CREATE POLICY "agendamentos_delete_superadmin_only"
    ON agendamentos
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- =============================================
-- Create audit function for unauthorized access attempts
-- =============================================

CREATE OR REPLACE FUNCTION log_unauthorized_agendamento_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log attempt to modify appointment that user doesn't own
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        IF OLD.aluno_id != auth.uid() AND OLD.professor_id != auth.uid() THEN
            INSERT INTO public.audit_log (
                table_name,
                operation,
                user_id,
                old_data,
                attempted_at
            ) VALUES (
                'agendamentos',
                TG_OP,
                auth.uid(),
                row_to_json(OLD),
                NOW()
            );
        END IF;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN undefined_table THEN
        -- audit_log table doesn't exist, ignore
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger is not created because audit_log table may not exist
-- Uncomment if audit logging is needed:
-- CREATE TRIGGER agendamento_access_audit
--     BEFORE UPDATE OR DELETE ON agendamentos
--     FOR EACH ROW
--     EXECUTE FUNCTION log_unauthorized_agendamento_access();
