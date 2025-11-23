-- Migration: Create cronogramas tables
-- Description: Tabelas para gerenciamento de cronogramas de estudo personalizados
-- Author: Claude Code
-- Date: 2025-01-23

-- 1. Tabela Cabeçalho: CRONOGRAMAS
-- Armazena as configurações e o estado geral do planejamento
CREATE TABLE IF NOT EXISTS public.cronogramas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    curso_alvo_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
    
    nome TEXT DEFAULT 'Meu Cronograma',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Configurações de Tempo e Disponibilidade
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    dias_estudo_semana INTEGER NOT NULL, -- Ex: 5 dias/semana
    horas_estudo_dia INTEGER NOT NULL,   -- Ex: 4 horas/dia
    
    -- Férias: Array de objetos JSON [{'inicio': '2024-07-01', 'fim': '2024-07-15'}]
    periodos_ferias JSONB DEFAULT '[]'::jsonb,
    
    -- Configurações de Conteúdo
    prioridade_minima INTEGER NOT NULL DEFAULT 1, -- Filtro de aulas (1 a 5)
    modalidade_estudo TEXT NOT NULL CHECK (modalidade_estudo IN ('paralelo', 'sequencial')),
    
    -- Disciplinas selecionadas para este cronograma (Array de UUIDs)
    disciplinas_selecionadas JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Apenas para modo Sequencial: Ordem das frentes ex: ['Física A', 'História B']
    ordem_frentes_preferencia JSONB
);

-- 2. Tabela Itens: CRONOGRAMA_ITENS
-- Armazena a distribuição das aulas. É aqui que o Drag & Drop atuará.
CREATE TABLE IF NOT EXISTS public.cronograma_itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cronograma_id UUID NOT NULL REFERENCES public.cronogramas(id) ON DELETE CASCADE,
    aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
    
    -- Organização Temporal
    semana_numero INTEGER NOT NULL, -- Semana 1, Semana 2, etc.
    ordem_na_semana INTEGER NOT NULL, -- Para ordenar visualmente dentro da coluna
    
    -- Controle de Progresso
    concluido BOOLEAN DEFAULT FALSE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários nas tabelas
COMMENT ON TABLE public.cronogramas IS 'Armazena configurações e estado geral dos cronogramas de estudo personalizados';
COMMENT ON TABLE public.cronograma_itens IS 'Armazena a distribuição das aulas por semana nos cronogramas';

-- 3. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_cronograma_aluno ON public.cronogramas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_itens_cronograma ON public.cronograma_itens(cronograma_id);
CREATE INDEX IF NOT EXISTS idx_itens_busca_semana ON public.cronograma_itens(cronograma_id, semana_numero);
CREATE INDEX IF NOT EXISTS idx_itens_aula ON public.cronograma_itens(aula_id);

-- 4. Trigger de Updated_at (Usando função existente)
DROP TRIGGER IF EXISTS on_update_cronogramas ON public.cronogramas;
CREATE TRIGGER on_update_cronogramas 
    BEFORE UPDATE ON public.cronogramas 
    FOR EACH ROW 
    EXECUTE PROCEDURE public.handle_updated_at();

-- 5. Segurança (RLS)
ALTER TABLE public.cronogramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cronograma_itens ENABLE ROW LEVEL SECURITY;

-- Políticas: O aluno tem controle total sobre SEUS cronogramas
DROP POLICY IF EXISTS "Aluno gerencia seus cronogramas" ON public.cronogramas;
CREATE POLICY "Aluno gerencia seus cronogramas" 
    ON public.cronogramas
    FOR ALL 
    USING (auth.uid() = aluno_id);

DROP POLICY IF EXISTS "Aluno gerencia itens do seu cronograma" ON public.cronograma_itens;
CREATE POLICY "Aluno gerencia itens do seu cronograma" 
    ON public.cronograma_itens
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.cronogramas c 
            WHERE c.id = cronograma_itens.cronograma_id 
            AND c.aluno_id = auth.uid()
        )
    );

