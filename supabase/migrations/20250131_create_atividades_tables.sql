-- 1.1. Limpeza

DROP TABLE IF EXISTS public.progresso_atividades CASCADE;

DROP TABLE IF EXISTS public.atividades CASCADE;

DROP TYPE IF EXISTS enum_status_atividade;

DROP TYPE IF EXISTS enum_dificuldade_percebida;

DROP TYPE IF EXISTS enum_tipo_atividade;



-- 1.2. Criação dos ENUMs

CREATE TYPE enum_status_atividade AS ENUM ('Pendente', 'Iniciado', 'Concluido');

CREATE TYPE enum_dificuldade_percebida AS ENUM ('Muito Facil', 'Facil', 'Medio', 'Dificil', 'Muito Dificil');



CREATE TYPE enum_tipo_atividade AS ENUM (

    'Nivel_1', 'Nivel_2', 'Nivel_3', 'Nivel_4',

    'Conceituario', 

    'Lista_Mista', 

    'Simulado_Diagnostico', 'Simulado_Cumulativo', 'Simulado_Global', 

    'Flashcards',

    'Revisao'

);



-- 1.3. Tabela de Atividades

CREATE TABLE public.atividades (

    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    modulo_id UUID REFERENCES public.modulos(id) ON DELETE CASCADE,

    tipo enum_tipo_atividade NOT NULL,

    titulo TEXT NOT NULL, 

    arquivo_url TEXT, 

    gabarito_url TEXT, 

    link_externo TEXT, 

    obrigatorio BOOLEAN DEFAULT TRUE,

    ordem_exibicao INTEGER DEFAULT 0,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);



-- 1.4. Tabela de Progresso

CREATE TABLE public.progresso_atividades (

    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,

    atividade_id UUID REFERENCES public.atividades(id) ON DELETE CASCADE,

    status enum_status_atividade DEFAULT 'Pendente',

    data_inicio TIMESTAMP WITH TIME ZONE,

    data_conclusao TIMESTAMP WITH TIME ZONE,

    questoes_totais INTEGER DEFAULT 0,

    questoes_acertos INTEGER DEFAULT 0,

    dificuldade_percebida enum_dificuldade_percebida,

    anotacoes_pessoais TEXT, 

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(aluno_id, atividade_id)

);



-- 1.5. Índices e Triggers

CREATE INDEX idx_atividades_modulo ON public.atividades(modulo_id);

CREATE INDEX idx_progresso_aluno_atividade ON public.progresso_atividades(aluno_id, atividade_id);

CREATE TRIGGER on_update_atividades BEFORE UPDATE ON public.atividades FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_update_progresso BEFORE UPDATE ON public.progresso_atividades FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();



-- 2. Segurança (RLS)

ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.progresso_atividades ENABLE ROW LEVEL SECURITY;



CREATE POLICY "Atividades visíveis para todos" ON public.atividades FOR SELECT USING (true);

CREATE POLICY "Professores gerenciam atividades" ON public.atividades 

    FOR ALL USING (EXISTS (SELECT 1 FROM public.professores WHERE id = auth.uid()));



CREATE POLICY "Aluno vê seu progresso" ON public.progresso_atividades FOR SELECT USING (auth.uid() = aluno_id);

CREATE POLICY "Aluno atualiza seu progresso" ON public.progresso_atividades FOR INSERT WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Aluno edita seu progresso" ON public.progresso_atividades FOR UPDATE USING (auth.uid() = aluno_id);



-- 3. Stored Procedure (Geração Automática)

CREATE OR REPLACE FUNCTION public.gerar_atividades_padrao(

    p_frente_id UUID

)

RETURNS VOID AS $$

DECLARE

    r_modulo RECORD;

    v_contador INTEGER := 0;

    v_total_modulos INTEGER;

BEGIN

    SELECT count(*) INTO v_total_modulos FROM public.modulos WHERE frente_id = p_frente_id;



    FOR r_modulo IN 

        SELECT * FROM public.modulos WHERE frente_id = p_frente_id ORDER BY numero_modulo ASC

    LOOP

        v_contador := v_contador + 1;



        -- PADRÃO

        INSERT INTO public.atividades (modulo_id, tipo, titulo, ordem_exibicao) VALUES

        (r_modulo.id, 'Conceituario', 'Conceituário', 1),

        (r_modulo.id, 'Nivel_1', 'Lista Nível 1 (Fixação)', 2),

        (r_modulo.id, 'Nivel_2', 'Lista Nível 2 (Aprofundamento)', 3),

        (r_modulo.id, 'Nivel_3', 'Lista Nível 3 (Grandes Bancas)', 4);

        

        -- LISTAS MISTAS (Regra: A cada 2)

        IF (v_contador % 2 = 0) THEN

            INSERT INTO public.atividades (modulo_id, tipo, titulo, ordem_exibicao) VALUES

            (r_modulo.id, 'Lista_Mista', 'Lista Mista (Módulos ' || (v_contador - 1) || ' e ' || v_contador || ')', 20);

        END IF;



        -- LISTA MISTA FINAL (Sobra ímpar)

        IF (v_contador = v_total_modulos AND v_contador % 2 <> 0) THEN

             INSERT INTO public.atividades (modulo_id, tipo, titulo, ordem_exibicao) VALUES

            (r_modulo.id, 'Lista_Mista', 'Lista Mista Final (Módulos ' || (v_contador - 2) || ' ao ' || v_contador || ')', 20);

        END IF;



        -- SIMULADOS

        IF (v_contador = 1) THEN

            INSERT INTO public.atividades (modulo_id, tipo, titulo, ordem_exibicao) VALUES

            (r_modulo.id, 'Simulado_Diagnostico', 'Simulado 0: Diagnóstico Inicial', 0);

        END IF;



        IF (v_contador % 3 = 0) THEN

            INSERT INTO public.atividades (modulo_id, tipo, titulo, ordem_exibicao) VALUES

            (r_modulo.id, 'Simulado_Cumulativo', 'Simulado Cumulativo (Módulos 1 ao ' || v_contador || ')', 30);

        END IF;



        IF (v_contador = v_total_modulos) THEN

            INSERT INTO public.atividades (modulo_id, tipo, titulo, ordem_exibicao) VALUES

            (r_modulo.id, 'Simulado_Global', 'Simulado 7: Global', 40),

            (r_modulo.id, 'Simulado_Global', 'Simulado 8: Global', 41),

            (r_modulo.id, 'Simulado_Global', 'Simulado 9: Global', 42);

        END IF;



    END LOOP;

END;

$$ LANGUAGE plpgsql;

