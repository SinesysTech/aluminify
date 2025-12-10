-- Migration: Enhance agendamentos system
-- Adds fields for cancellation tracking, reminders, notifications, and professor configurations

-- =============================================
-- 1. Add new columns to agendamentos table
-- =============================================

ALTER TABLE agendamentos
ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
ADD COLUMN IF NOT EXISTS cancelado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lembrete_enviado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lembrete_enviado_em TIMESTAMPTZ;

-- =============================================
-- 2. Create agendamento_notificacoes table
-- =============================================

CREATE TABLE IF NOT EXISTS agendamento_notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('criacao', 'confirmacao', 'cancelamento', 'lembrete', 'alteracao', 'rejeicao')),
    destinatario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enviado BOOLEAN DEFAULT false,
    enviado_em TIMESTAMPTZ,
    erro TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE agendamento_notificacoes ENABLE ROW LEVEL SECURITY;

-- Policies for agendamento_notificacoes
CREATE POLICY "Users can view their own notifications" ON agendamento_notificacoes
    FOR SELECT
    USING (auth.uid() = destinatario_id);

CREATE POLICY "System can insert notifications" ON agendamento_notificacoes
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update notifications" ON agendamento_notificacoes
    FOR UPDATE
    USING (true);

-- =============================================
-- 3. Create agendamento_configuracoes table
-- =============================================

CREATE TABLE IF NOT EXISTS agendamento_configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_confirmar BOOLEAN DEFAULT false,
    tempo_antecedencia_minimo INT DEFAULT 60, -- minutes
    tempo_lembrete_minutos INT DEFAULT 1440, -- 24 hours
    link_reuniao_padrao TEXT,
    mensagem_confirmacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE agendamento_configuracoes ENABLE ROW LEVEL SECURITY;

-- Policies for agendamento_configuracoes
CREATE POLICY "Professors can view their own config" ON agendamento_configuracoes
    FOR SELECT
    USING (auth.uid() = professor_id);

CREATE POLICY "Professors can manage their own config" ON agendamento_configuracoes
    FOR ALL
    USING (auth.uid() = professor_id);

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_agendamento_configuracoes
    BEFORE UPDATE ON agendamento_configuracoes
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- 4. Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_agendamentos_professor_data ON agendamentos(professor_id, data_inicio);
CREATE INDEX IF NOT EXISTS idx_agendamentos_aluno_data ON agendamentos(aluno_id, data_inicio);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_lembrete ON agendamentos(lembrete_enviado, data_inicio) WHERE status = 'confirmado';
CREATE INDEX IF NOT EXISTS idx_notificacoes_enviado ON agendamento_notificacoes(enviado, created_at);
CREATE INDEX IF NOT EXISTS idx_notificacoes_destinatario ON agendamento_notificacoes(destinatario_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notificacoes_agendamento ON agendamento_notificacoes(agendamento_id);
