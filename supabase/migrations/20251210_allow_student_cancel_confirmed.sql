-- Migration: Allow students to cancel confirmed appointments
-- This migration adjusts RLS policies to allow students to cancel both pending and confirmed appointments
-- The business logic validation (time window check) will be enforced in the application layer

-- =============================================
-- Drop and recreate the student update policy
-- =============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Students can update own appointments" ON agendamentos;

-- Create new policy allowing students to update both pending and confirmed appointments
-- The application layer (validateCancellation) will enforce the time-window restriction
CREATE POLICY "Students can update own appointments" ON agendamentos
    FOR UPDATE
    USING (
      auth.uid() = aluno_id 
      AND status IN ('pendente', 'confirmado')
    );

-- =============================================
-- Alternative: Create a dedicated function for student cancellation
-- This approach enforces the time check at the database level
-- (commented out - only uncomment if you prefer database-level enforcement)
-- =============================================

/*
-- Function to validate cancellation time window (2 hours before appointment)
CREATE OR REPLACE FUNCTION can_cancel_agendamento(
  p_agendamento_id UUID,
  p_user_id UUID,
  p_min_hours_before INT DEFAULT 2
)
RETURNS BOOLEAN AS $$
DECLARE
  v_data_inicio TIMESTAMPTZ;
  v_aluno_id UUID;
  v_status TEXT;
BEGIN
  -- Get agendamento details
  SELECT data_inicio, aluno_id, status
  INTO v_data_inicio, v_aluno_id, v_status
  FROM agendamentos
  WHERE id = p_agendamento_id;
  
  -- Check if user is the student
  IF v_aluno_id != p_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if status allows cancellation
  IF v_status NOT IN ('pendente', 'confirmado') THEN
    RETURN FALSE;
  END IF;
  
  -- Check if there's enough time before the appointment
  IF v_data_inicio <= (NOW() + (p_min_hours_before || ' hours')::INTERVAL) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION can_cancel_agendamento TO authenticated;

-- Alternative policy using the function
-- DROP POLICY IF EXISTS "Students can update own appointments" ON agendamentos;
-- CREATE POLICY "Students can update own appointments" ON agendamentos
--     FOR UPDATE
--     USING (can_cancel_agendamento(id, auth.uid()));
*/
