-- Migration: Add professor integrations for meeting providers
-- Stores OAuth tokens and provider preferences for Google Meet, Zoom, etc.

-- =============================================
-- Create professor_integracoes table
-- =============================================

CREATE TABLE IF NOT EXISTS professor_integracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'default' CHECK (provider IN ('google', 'zoom', 'default')),
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE professor_integracoes ENABLE ROW LEVEL SECURITY;

-- Policies for professor_integracoes
CREATE POLICY "Professors can view their own integrations" ON professor_integracoes
    FOR SELECT
    USING (auth.uid() = professor_id);

CREATE POLICY "Professors can manage their own integrations" ON professor_integracoes
    FOR ALL
    USING (auth.uid() = professor_id);

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_professor_integracoes
    BEFORE UPDATE ON professor_integracoes
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- Create index for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_professor_integracoes_professor
    ON professor_integracoes(professor_id);
