-- Migration: Create ai_agents table
-- Description: Multi-tenant AI agent configuration
-- Each tenant can have their own AI agents with custom name, avatar, prompts, and integration
-- Author: AI Agents System
-- Date: 2026-01-27

-- 1. Create ai_agents table
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,

    -- Identification
    slug text NOT NULL,                              -- URL-safe identifier: 'tobias', 'maria', 'assistente'
    name text NOT NULL,                              -- Display name: 'TobIAs', 'Maria', 'Assistente Virtual'
    description text,                                -- Admin description

    -- Appearance
    avatar_url text,                                 -- Avatar image URL
    greeting_message text,                           -- Initial greeting shown to users
    placeholder_text text DEFAULT 'Digite sua mensagem...',  -- Input placeholder

    -- Behavior
    system_prompt text,                              -- System instructions for the AI
    model text DEFAULT 'gpt-4o-mini',                -- Model to use
    temperature numeric(3,2) DEFAULT 0.7,            -- Model temperature (0-2)

    -- Integration
    integration_type text NOT NULL DEFAULT 'copilotkit',  -- 'copilotkit' | 'n8n' | 'custom'
    integration_config jsonb DEFAULT '{}'::jsonb,         -- Type-specific config (n8n URL, API keys, etc.)

    -- Features
    supports_attachments boolean DEFAULT false,      -- Can receive file attachments
    supports_voice boolean DEFAULT false,            -- Has voice input/output

    -- Status
    is_active boolean DEFAULT true,                  -- Agent is enabled
    is_default boolean DEFAULT false,                -- Default agent for the tenant

    -- Metadata
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),

    -- Constraints
    UNIQUE(empresa_id, slug)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_empresa_id ON public.ai_agents(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_slug ON public.ai_agents(slug);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_active ON public.ai_agents(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_default ON public.ai_agents(is_default) WHERE is_default = true;

-- 3. Create updated_at trigger
CREATE TRIGGER handle_updated_at_ai_agents
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Users can view active agents from their empresa
CREATE POLICY "Users can view active agents from their empresa"
    ON public.ai_agents
    FOR SELECT
    TO authenticated
    USING (
        is_active = true
        AND (
            -- Professors/staff from the empresa
            empresa_id IN (
                SELECT p.empresa_id FROM public.professores p WHERE p.id = auth.uid()
            )
            OR
            -- Students enrolled in courses from the empresa
            empresa_id IN (
                SELECT c.empresa_id
                FROM public.alunos_cursos ac
                JOIN public.cursos c ON ac.curso_id = c.id
                WHERE ac.aluno_id = auth.uid()
            )
            OR
            -- Superadmins can see all
            EXISTS (
                SELECT 1 FROM auth.users
                WHERE id = auth.uid()
                AND raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

-- Empresa admins can manage agents
CREATE POLICY "Empresa admins can manage agents"
    ON public.ai_agents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = auth.uid()
            AND empresa_id = ai_agents.empresa_id
            AND is_admin = true
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.professores
            WHERE id = auth.uid()
            AND empresa_id = ai_agents.empresa_id
            AND is_admin = true
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 6. Add comments
COMMENT ON TABLE public.ai_agents IS 'Multi-tenant AI agent configuration. Each tenant can have multiple agents with custom branding and behavior.';
COMMENT ON COLUMN public.ai_agents.slug IS 'URL-safe identifier for the agent, unique per empresa';
COMMENT ON COLUMN public.ai_agents.integration_type IS 'Type of backend integration: copilotkit (default), n8n (legacy), or custom';
COMMENT ON COLUMN public.ai_agents.integration_config IS 'JSON config for the integration type (e.g., n8n webhook URL)';
COMMENT ON COLUMN public.ai_agents.is_default IS 'If true, this is the default agent shown when accessing /agente without a slug';

-- 7. Insert TobIAs agent for CDF tenant
INSERT INTO public.ai_agents (
    empresa_id,
    slug,
    name,
    description,
    avatar_url,
    greeting_message,
    placeholder_text,
    system_prompt,
    integration_type,
    integration_config,
    supports_attachments,
    is_active,
    is_default
) VALUES (
    'cf93a7a5-afbe-4e99-ac66-9d312a4fc140',  -- CDF empresa_id
    'tobias',
    'TobIAs',
    'Assistente de IA do CDF - Monitoria do curso',
    '/tobiasavatar.png',
    E'Olá! Eu sou o TobIAs, responsável pela monitoria do curso CDF.\n\nComo posso ajudá-lo hoje?',
    'Digite sua mensagem...',
    E'Você é o TobIAs, um assistente de estudos do CDF (Curso de Física).\nSeu objetivo é ajudar alunos com dúvidas sobre o curso, materiais e atividades.\nSeja sempre prestativo, educado e responda em português brasileiro.',
    'n8n',  -- Uses legacy n8n integration
    '{"webhook_url": "/api/tobias/chat"}'::jsonb,
    true,   -- Supports attachments
    true,   -- Active
    true    -- Default agent for CDF
) ON CONFLICT (empresa_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    avatar_url = EXCLUDED.avatar_url,
    greeting_message = EXCLUDED.greeting_message,
    system_prompt = EXCLUDED.system_prompt,
    updated_at = now();
