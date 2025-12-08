-- Create agendamentos table
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluido')),
    link_reuniao TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Create agendamento_disponibilidade table
CREATE TABLE IF NOT EXISTS agendamento_disponibilidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamento_disponibilidade ENABLE ROW LEVEL SECURITY;

-- Policies for agendamentos

-- Professors can view their own appointments
CREATE POLICY "Professors can view own appointments" ON agendamentos
    FOR SELECT
    USING (auth.uid() = professor_id);

-- Students can view their own appointments
CREATE POLICY "Students can view own appointments" ON agendamentos
    FOR SELECT
    USING (auth.uid() = aluno_id);

-- Students can insert appointments (requesting)
CREATE POLICY "Students can create appointments" ON agendamentos
    FOR INSERT
    WITH CHECK (auth.uid() = aluno_id);

-- Professors can update appointments (confirm/cancel)
CREATE POLICY "Professors can update own appointments" ON agendamentos
    FOR UPDATE
    USING (auth.uid() = professor_id);
    
-- Students can update their own appointments (cancel only ideally, but generally update if pending)
CREATE POLICY "Students can update own appointments" ON agendamentos
    FOR UPDATE
    USING (auth.uid() = aluno_id AND status = 'pendente');


-- Policies for agendamento_disponibilidade

-- Public can view active availability (for booking)
CREATE POLICY "Public can view active availability" ON agendamento_disponibilidade
    FOR SELECT
    USING (ativo = true);

-- Professors can manage their own availability
CREATE POLICY "Professors can manage own availability" ON agendamento_disponibilidade
    FOR ALL
    USING (auth.uid() = professor_id);

-- Trigger for handle_updated_at on agendamentos
CREATE TRIGGER handle_updated_at_agendamentos
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger for handle_updated_at on agendamento_disponibilidade
CREATE TRIGGER handle_updated_at_agendamento_disponibilidade
    BEFORE UPDATE ON agendamento_disponibilidade
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
