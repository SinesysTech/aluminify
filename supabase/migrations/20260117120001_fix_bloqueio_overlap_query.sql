-- Migration: Fix bloqueio overlap query for correct range checking
-- Description: Create a function to properly check date range overlaps for bloqueios
-- Date: 2026-01-17

-- =============================================
-- Create function for proper range overlap check
-- =============================================

-- Function to check if a time range overlaps with any bloqueios
CREATE OR REPLACE FUNCTION check_bloqueio_overlap(
    p_professor_id UUID,
    p_empresa_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM agendamento_bloqueios b
        WHERE (
            -- Personal bloqueio for the professor
            b.professor_id = p_professor_id
            OR
            -- Company-wide bloqueio (professor_id is null)
            (b.professor_id IS NULL AND b.empresa_id = p_empresa_id)
        )
        -- Proper range overlap check: two ranges overlap if start1 < end2 AND end1 > start2
        AND p_start_time < b.data_fim
        AND p_end_time > b.data_inicio
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_bloqueio_overlap TO authenticated;

-- =============================================
-- Create function to get affected agendamentos by a bloqueio
-- =============================================

CREATE OR REPLACE FUNCTION get_agendamentos_affected_by_bloqueio(
    p_professor_id UUID,
    p_empresa_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_bloqueio_professor_id UUID DEFAULT NULL -- NULL means company-wide
)
RETURNS TABLE (
    id UUID,
    aluno_id UUID,
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.aluno_id,
        a.data_inicio,
        a.data_fim,
        a.status
    FROM agendamentos a
    WHERE (
        -- If bloqueio is for specific professor
        (p_bloqueio_professor_id IS NOT NULL AND a.professor_id = p_bloqueio_professor_id)
        OR
        -- If bloqueio is company-wide, get all professors in company
        (p_bloqueio_professor_id IS NULL AND a.professor_id IN (
            SELECT id FROM professores WHERE empresa_id = p_empresa_id
        ))
    )
    AND a.status IN ('pendente', 'confirmado')
    -- Proper range overlap check
    AND a.data_inicio < p_end_time
    AND a.data_fim > p_start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_agendamentos_affected_by_bloqueio TO authenticated;

-- =============================================
-- Create function to cancel affected agendamentos when creating bloqueio
-- =============================================

CREATE OR REPLACE FUNCTION cancel_agendamentos_for_bloqueio(
    p_bloqueio_id UUID,
    p_motivo TEXT DEFAULT 'Cancelado devido a bloqueio de agenda'
)
RETURNS INTEGER AS $$
DECLARE
    v_bloqueio RECORD;
    v_cancelled_count INTEGER := 0;
BEGIN
    -- Get bloqueio details
    SELECT * INTO v_bloqueio
    FROM agendamento_bloqueios
    WHERE id = p_bloqueio_id;

    IF v_bloqueio IS NULL THEN
        RETURN 0;
    END IF;

    -- Update affected agendamentos
    UPDATE agendamentos
    SET
        status = 'cancelado',
        motivo_cancelamento = p_motivo,
        cancelado_por = v_bloqueio.criado_por,
        updated_at = NOW()
    WHERE id IN (
        SELECT a.id
        FROM agendamentos a
        WHERE (
            (v_bloqueio.professor_id IS NOT NULL AND a.professor_id = v_bloqueio.professor_id)
            OR
            (v_bloqueio.professor_id IS NULL AND a.professor_id IN (
                SELECT id FROM professores WHERE empresa_id = v_bloqueio.empresa_id
            ))
        )
        AND a.status IN ('pendente', 'confirmado')
        AND a.data_inicio < v_bloqueio.data_fim
        AND a.data_fim > v_bloqueio.data_inicio
    );

    GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;

    RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION cancel_agendamentos_for_bloqueio TO authenticated;
