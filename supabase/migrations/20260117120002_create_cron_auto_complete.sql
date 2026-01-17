-- Migration: Create cron trigger for auto-completing past appointments
-- Description: Set up pg_cron job to automatically mark past confirmed appointments as completed
-- Date: 2026-01-17

-- Note: pg_cron extension must be enabled in Supabase dashboard
-- This migration creates the function and documents the cron setup

-- =============================================
-- Create function to auto-complete past appointments
-- =============================================

CREATE OR REPLACE FUNCTION auto_complete_past_agendamentos()
RETURNS INTEGER AS $$
DECLARE
    v_completed_count INTEGER := 0;
BEGIN
    -- Update confirmed appointments that have ended
    UPDATE agendamentos
    SET
        status = 'concluido',
        updated_at = NOW()
    WHERE status = 'confirmado'
    AND data_fim < NOW();

    GET DIAGNOSTICS v_completed_count = ROW_COUNT;

    -- Log the operation
    RAISE NOTICE 'Auto-completed % agendamentos at %', v_completed_count, NOW();

    RETURN v_completed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role (for cron)
GRANT EXECUTE ON FUNCTION auto_complete_past_agendamentos TO service_role;

-- =============================================
-- CRON SETUP INSTRUCTIONS
-- =============================================
--
-- To enable the cron job, run these commands in the Supabase SQL Editor
-- after enabling the pg_cron extension in the dashboard:
--
-- 1. Enable pg_cron extension (if not already enabled):
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Create the cron job to run every hour:
--    SELECT cron.schedule(
--        'auto-complete-agendamentos',  -- job name
--        '0 * * * *',                    -- every hour at minute 0
--        $$SELECT auto_complete_past_agendamentos()$$
--    );
--
-- 3. To check scheduled jobs:
--    SELECT * FROM cron.job;
--
-- 4. To check job run history:
--    SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
--
-- 5. To remove the job:
--    SELECT cron.unschedule('auto-complete-agendamentos');
--
-- =============================================

-- Alternative: Create a trigger that runs on INSERT of new agendamentos
-- This ensures old ones get checked when new activity happens

CREATE OR REPLACE FUNCTION check_and_complete_past_agendamentos()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new agendamento is created, check and complete any past ones
    PERFORM auto_complete_past_agendamentos();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uncomment to enable trigger-based approach:
-- DROP TRIGGER IF EXISTS trigger_check_past_agendamentos ON agendamentos;
-- CREATE TRIGGER trigger_check_past_agendamentos
--     AFTER INSERT ON agendamentos
--     FOR EACH STATEMENT
--     EXECUTE FUNCTION check_and_complete_past_agendamentos();
