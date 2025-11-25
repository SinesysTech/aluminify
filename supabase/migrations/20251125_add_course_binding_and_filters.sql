-- Migration: Add course binding to content hierarchy and enrich cronogramas metadata
-- Description: Associates frentes with cursos, stores selected modules and completion filter flags on cronogramas.
-- Author: GPT-5.1 Codex
-- Date: 2025-11-25

-- 1. Associate frentes to cursos so uploads stay scoped to a specific course
ALTER TABLE public.frentes
    ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_frentes_curso_id ON public.frentes(curso_id);

COMMENT ON COLUMN public.frentes.curso_id IS 'Curso ao qual esta frente/módulo pertence';

ALTER TABLE public.modulos
    ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_modulos_curso_id ON public.modulos(curso_id);

COMMENT ON COLUMN public.modulos.curso_id IS 'Curso ao qual este módulo pertence';

ALTER TABLE public.aulas
    ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_aulas_curso_id ON public.aulas(curso_id);

COMMENT ON COLUMN public.aulas.curso_id IS 'Curso ao qual esta aula pertence';

-- 2. Persist metadata about module filtering and completion handling inside cronogramas
ALTER TABLE public.cronogramas
    ADD COLUMN IF NOT EXISTS modulos_selecionados JSONB,
    ADD COLUMN IF NOT EXISTS excluir_aulas_concluidas BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.cronogramas.modulos_selecionados IS 'Lista de módulos escolhidos pelo aluno ao gerar o cronograma';
COMMENT ON COLUMN public.cronogramas.excluir_aulas_concluidas IS 'Indica se aulas já concluídas foram excluídas automaticamente do cronograma';

-- 3. Histórico de aulas concluídas por aluno
CREATE TABLE IF NOT EXISTS public.aulas_concluidas (
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (aluno_id, aula_id)
);

CREATE INDEX IF NOT EXISTS idx_aulas_concluidas_curso_id ON public.aulas_concluidas(curso_id);

ALTER TABLE public.aulas_concluidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aluno gerencia aulas concluídas" ON public.aulas_concluidas
    FOR ALL
    USING (auth.uid() = aluno_id)
    WITH CHECK (auth.uid() = aluno_id);

CREATE TRIGGER on_update_aulas_concluidas
    BEFORE UPDATE ON public.aulas_concluidas
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();


