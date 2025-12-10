-- Migration: Configure Supabase settings for email notifications
-- This sets the runtime settings needed by the send_agendamento_email trigger

-- Note: Replace these placeholder values with your actual Supabase URL and service role key
-- You can also set these via ALTER DATABASE or ALTER ROLE commands

-- Example (uncomment and replace with real values):
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';

-- Alternative: Use environment variables or Supabase secrets
-- The trigger function can be modified to use vault.decrypted_secrets if needed

-- For now, we'll enable pg_net extension which is required for the trigger
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage on net schema to necessary roles
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
