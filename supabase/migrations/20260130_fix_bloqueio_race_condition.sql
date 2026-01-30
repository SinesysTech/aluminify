-- Migration: Fix race condition in bloqueio creation
-- Description: Creates atomic function to create bloqueio and cancel conflicting appointments
-- Date: 2026-01-30

-- Create function to atomically create bloqueio and cancel conflicts
CREATE OR REPLACE FUNCTION create_bloqueio_and_cancel_conflicts(
  p_professor_id UUID,
  p_empresa_id UUID,
  p_tipo enum_tipo_bloqueio,
  p_data_inicio TIMESTAMPTZ,
  p_data_fim TIMESTAMPTZ,
  p_motivo TEXT,
  p_criado_por UUID
) RETURNS UUID AS $$
DECLARE
  v_bloqueio_id UUID;
  v_motivo_cancelamento TEXT;
BEGIN
  -- Insert bloqueio
  INSERT INTO agendamento_bloqueios (
    professor_id, empresa_id, tipo, data_inicio, data_fim, motivo, criado_por
  ) VALUES (
    p_professor_id, p_empresa_id, p_tipo, p_data_inicio, p_data_fim, p_motivo, p_criado_por
  ) RETURNING id INTO v_bloqueio_id;
  
  -- Prepare cancellation message
  v_motivo_cancelamento := 'Bloqueio de agenda: ' || COALESCE(p_motivo, 'Sem motivo especificado');
  
  -- Cancel conflicting appointments atomically
  IF p_professor_id IS NOT NULL THEN
    -- Cancel for specific professor
    UPDATE agendamentos
    SET status = 'cancelado',
        motivo_cancelamento = v_motivo_cancelamento,
        cancelado_por = p_criado_por
    WHERE professor_id = p_professor_id
      AND status IN ('pendente', 'confirmado')
      AND data_inicio < p_data_fim
      AND data_fim > p_data_inicio;
  ELSE
    -- Cancel for all professors in empresa
    UPDATE agendamentos
    SET status = 'cancelado',
        motivo_cancelamento = v_motivo_cancelamento,
        cancelado_por = p_criado_por
    WHERE professor_id IN (
        SELECT id FROM usuarios WHERE empresa_id = p_empresa_id
      )
      AND status IN ('pendente', 'confirmado')
      AND data_inicio < p_data_fim
      AND data_fim > p_data_inicio;
  END IF;
  
  RETURN v_bloqueio_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION create_bloqueio_and_cancel_conflicts IS 'Atomically creates a bloqueio and cancels all conflicting appointments to prevent race conditions';
