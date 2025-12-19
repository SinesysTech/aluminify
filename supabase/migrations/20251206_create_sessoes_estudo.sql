-- Tabela de Sessões de Estudo
CREATE TABLE public.sessoes_estudo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,

    -- Contexto do Estudo
    disciplina_id UUID REFERENCES public.disciplinas(id),
    frente_id UUID REFERENCES public.frentes(id), -- Opcional
    atividade_relacionada_id UUID REFERENCES public.atividades(id), -- Opcional (Vindo da Sala de Estudos)

    -- Tempos
    inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fim TIMESTAMP WITH TIME ZONE, -- Null enquanto roda

    -- Métricas Finais (Calculadas no Encerramento)
    tempo_total_bruto_segundos INTEGER, -- (Fim - Início)
    tempo_total_liquido_segundos INTEGER, -- (Bruto - Soma das Pausas)

    -- Logs Detalhados (Fonte da Verdade)
    -- Formato: [{"inicio": "ISO...", "fim": "ISO...", "tipo": "manual" | "distracao"}]
    log_pausas JSONB DEFAULT '[]'::jsonb,

    -- Qualidade e Metadados
    metodo_estudo TEXT, -- 'pomodoro', 'cronometro', 'timer'
    nivel_foco INTEGER, -- Avaliação 1 a 5 (Input do aluno no fim)

    status TEXT DEFAULT 'em_andamento', -- 'concluido', 'descartado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices e RLS
CREATE INDEX idx_sessoes_aluno_data ON public.sessoes_estudo(aluno_id, inicio);
CREATE INDEX idx_sessoes_disciplina ON public.sessoes_estudo(disciplina_id); -- Para analytics globais

ALTER TABLE public.sessoes_estudo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno gerencia suas sessoes" ON public.sessoes_estudo FOR ALL USING (auth.uid() = aluno_id);





















