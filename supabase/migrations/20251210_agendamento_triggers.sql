-- Migration: Add triggers for agendamento notifications

-- =============================================
-- Function to create notification on agendamento changes
-- =============================================

CREATE OR REPLACE FUNCTION notify_agendamento_change()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: Create notification for professor (new appointment request)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO agendamento_notificacoes (agendamento_id, tipo, destinatario_id)
    VALUES (NEW.id, 'criacao', NEW.professor_id);
    RETURN NEW;
  END IF;

  -- On UPDATE: Handle status changes
  IF TG_OP = 'UPDATE' THEN
    -- Status changed to confirmed
    IF OLD.status != 'confirmado' AND NEW.status = 'confirmado' THEN
      INSERT INTO agendamento_notificacoes (agendamento_id, tipo, destinatario_id)
      VALUES (NEW.id, 'confirmacao', NEW.aluno_id);
    END IF;

    -- Status changed to cancelled (rejection or cancellation)
    IF OLD.status != 'cancelado' AND NEW.status = 'cancelado' THEN
      -- If cancelled by professor (rejecting a pending), notify student
      IF OLD.status = 'pendente' AND NEW.cancelado_por = NEW.professor_id THEN
        INSERT INTO agendamento_notificacoes (agendamento_id, tipo, destinatario_id)
        VALUES (NEW.id, 'rejeicao', NEW.aluno_id);
      -- If cancelled by student, notify professor
      ELSIF NEW.cancelado_por = NEW.aluno_id THEN
        INSERT INTO agendamento_notificacoes (agendamento_id, tipo, destinatario_id)
        VALUES (NEW.id, 'cancelamento', NEW.professor_id);
      -- If cancelled by professor (after confirmation), notify student
      ELSIF NEW.cancelado_por = NEW.professor_id THEN
        INSERT INTO agendamento_notificacoes (agendamento_id, tipo, destinatario_id)
        VALUES (NEW.id, 'cancelamento', NEW.aluno_id);
      END IF;
    END IF;

    -- Link reuniao updated (notify student)
    IF OLD.link_reuniao IS DISTINCT FROM NEW.link_reuniao AND NEW.link_reuniao IS NOT NULL THEN
      IF NEW.status = 'confirmado' THEN
        INSERT INTO agendamento_notificacoes (agendamento_id, tipo, destinatario_id)
        VALUES (NEW.id, 'alteracao', NEW.aluno_id);
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Function to send email notification via Edge Function
-- =============================================

CREATE OR REPLACE FUNCTION send_agendamento_email()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_function_url TEXT;
  v_payload JSONB;
BEGIN
  -- Skip lembrete notifications as they are handled by processar-lembretes Edge Function
  IF NEW.tipo = 'lembrete' THEN
    RETURN NEW;
  END IF;

  -- Get Supabase URL from app settings (you may need to adjust this)
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);
  
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    -- If settings not available, log and continue
    RAISE WARNING 'Supabase URL or service key not configured for email notifications';
    RETURN NEW;
  END IF;

  v_function_url := v_supabase_url || '/functions/v1/enviar-notificacao-agendamento';
  
  v_payload := jsonb_build_object(
    'agendamento_id', NEW.agendamento_id,
    'tipo', NEW.tipo,
    'destinatario_id', NEW.destinatario_id
  );

  -- Call Edge Function asynchronously using pg_net extension
  -- Note: pg_net must be enabled in your Supabase project
  PERFORM net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := v_payload
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error sending email notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Create triggers
-- =============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_agendamento_change ON agendamentos;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER on_agendamento_change
  AFTER INSERT OR UPDATE ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION notify_agendamento_change();

-- Drop existing email trigger if exists
DROP TRIGGER IF EXISTS on_notificacao_send_email ON agendamento_notificacoes;

-- Create trigger to send emails when notifications are created
-- Note: This requires pg_net extension to be enabled
CREATE TRIGGER on_notificacao_send_email
  AFTER INSERT ON agendamento_notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION send_agendamento_email();

-- =============================================
-- Add index to improve notification queries
-- =============================================

CREATE INDEX IF NOT EXISTS idx_agendamento_notificacoes_pending
  ON agendamento_notificacoes(agendamento_id, tipo, destinatario_id)
  WHERE enviado = false;
