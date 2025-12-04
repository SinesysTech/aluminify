-- Migration: Add tempo_estudos_concluido tracking
-- Description: Adiciona tabela para rastrear conclusão do tempo de estudos e exercícios por disciplina/frente por dia
-- Author: Claude Code
-- Date: 2025-01-28

-- Tabela para rastrear conclusão do tempo de estudos por disciplina/frente por dia
CREATE TABLE IF NOT EXISTS public.cronograma_tempo_estudos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cronograma_id UUID NOT NULL REFERENCES public.cronogramas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    disciplina_id UUID NOT NULL,
    frente_id UUID NOT NULL,
    tempo_estudos_concluido BOOLEAN DEFAULT FALSE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que só existe um registro por combinação de cronograma/data/disciplina/frente
    UNIQUE(cronograma_id, data, disciplina_id, frente_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tempo_estudos_cronograma_data ON public.cronograma_tempo_estudos(cronograma_id, data);
CREATE INDEX IF NOT EXISTS idx_tempo_estudos_disciplina_frente ON public.cronograma_tempo_estudos(disciplina_id, frente_id);

-- Comentário na tabela
COMMENT ON TABLE public.cronograma_tempo_estudos IS 'Rastreia a conclusão do tempo de estudos e exercícios por disciplina/frente por dia';

-- Trigger de Updated_at
DROP TRIGGER IF EXISTS on_update_tempo_estudos ON public.cronograma_tempo_estudos;
CREATE TRIGGER on_update_tempo_estudos 
    BEFORE UPDATE ON public.cronograma_tempo_estudos 
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_updated_at();

-- Segurança (RLS)
ALTER TABLE public.cronograma_tempo_estudos ENABLE ROW LEVEL SECURITY;

-- Política: O aluno tem controle total sobre seus registros de tempo de estudos
DROP POLICY IF EXISTS "Aluno gerencia tempo de estudos do seu cronograma" ON public.cronograma_tempo_estudos;
CREATE POLICY "Aluno gerencia tempo de estudos do seu cronograma" 
    ON public.cronograma_tempo_estudos
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.cronogramas c 
            WHERE c.id = cronograma_tempo_estudos.cronograma_id 
            AND c.aluno_id = auth.uid()
        )
    );




