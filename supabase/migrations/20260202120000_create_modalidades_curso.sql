-- Create modalidades_curso table
CREATE TABLE IF NOT EXISTS public.modalidades_curso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    
    -- Each tenant should have unique slugs for modalities
    CONSTRAINT modalidades_curso_slug_empresa_unique UNIQUE (slug, empresa_id)
);

-- Enable RLS
ALTER TABLE public.modalidades_curso ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Modalidades are viewable by everyone in the tenant" ON public.modalidades_curso
    FOR SELECT
    USING (empresa_id = (SELECT public.get_user_empresa_id()));

-- Using is_empresa_admin() OR is_professor() checks
CREATE POLICY "Modalidades are insertable by admins/professors of the tenant" ON public.modalidades_curso
    FOR INSERT
    WITH CHECK (
        empresa_id = (SELECT public.get_user_empresa_id()) AND
        (public.is_empresa_admin() OR public.is_professor())
    );

CREATE POLICY "Modalidades are updatable by admins/professors of the tenant" ON public.modalidades_curso
    FOR UPDATE
    USING (
        empresa_id = (SELECT public.get_user_empresa_id()) AND
        (public.is_empresa_admin() OR public.is_professor())
    );

CREATE POLICY "Modalidades are deletable by admins/professors of the tenant" ON public.modalidades_curso
    FOR DELETE
    USING (
        empresa_id = (SELECT public.get_user_empresa_id()) AND
        (public.is_empresa_admin() OR public.is_professor())
    );

-- Backfill modalities for existing tenants
DO $$
DECLARE
    empresa_record RECORD;
    ead_id UUID;
    live_id UUID;
BEGIN
    FOR empresa_record IN SELECT id FROM public.empresas
    LOOP
        -- Insert 'EAD'
        INSERT INTO public.modalidades_curso (empresa_id, nome, slug)
        VALUES (empresa_record.id, 'EAD', 'ead')
        ON CONFLICT (slug, empresa_id) DO NOTHING;

        -- Insert 'LIVE'
        INSERT INTO public.modalidades_curso (empresa_id, nome, slug)
        VALUES (empresa_record.id, 'LIVE', 'live')
        ON CONFLICT (slug, empresa_id) DO NOTHING;
    END LOOP;
END $$;

-- Add modalidade_id to cursos table
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS modalidade_id UUID REFERENCES public.modalidades_curso(id);

-- Migrate existing data in cursos
DO $$
DECLARE
    curso_record RECORD;
    mod_id UUID;
BEGIN
    -- Update courses with 'EAD'
    UPDATE public.cursos c
    SET modalidade_id = (
        SELECT id FROM public.modalidades_curso mc 
        WHERE mc.empresa_id = c.empresa_id AND mc.slug = 'ead'
        LIMIT 1
    )
    WHERE c.modalidade::text = 'EAD' AND c.modalidade_id IS NULL;

    -- Update courses with 'LIVE'
    UPDATE public.cursos c
    SET modalidade_id = (
        SELECT id FROM public.modalidades_curso mc 
        WHERE mc.empresa_id = c.empresa_id AND mc.slug = 'live'
        LIMIT 1
    )
    WHERE c.modalidade::text = 'LIVE' AND c.modalidade_id IS NULL;
END $$;
