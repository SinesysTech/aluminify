-- Migration: Regras de Atividades V2

DROP FUNCTION IF EXISTS public.gerar_atividades_padrao;
DROP FUNCTION IF EXISTS public.gerar_atividades_personalizadas;
DROP TABLE IF EXISTS public.regras_atividades CASCADE;

CREATE TABLE public.regras_atividades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    tipo_atividade enum_tipo_atividade NOT NULL,
    nome_padrao TEXT NOT NULL,
    frequencia_modulos INTEGER DEFAULT 1,
    comecar_no_modulo INTEGER DEFAULT 1,
    acumulativo BOOLEAN DEFAULT FALSE,
    gerar_no_ultimo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_regras_atividades_curso ON public.regras_atividades(curso_id);

CREATE TRIGGER on_update_regras_atividades 
    BEFORE UPDATE ON public.regras_atividades 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.regras_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regras visíveis para autenticados" ON public.regras_atividades 
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Professores gerenciam regras" ON public.regras_atividades 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.professores WHERE id = auth.uid()));

CREATE OR REPLACE FUNCTION public.gerar_atividades_personalizadas(p_curso_id UUID, p_frente_id UUID)
RETURNS VOID AS $$
DECLARE
    r_regra RECORD;
    r_modulo RECORD;
    v_contador INTEGER;
    v_total_modulos INTEGER;
    v_titulo_final TEXT;
    v_modulo_inicio INTEGER;
BEGIN
    SELECT count(*) INTO v_total_modulos FROM public.modulos WHERE frente_id = p_frente_id;
    IF v_total_modulos = 0 THEN RETURN; END IF;

    DELETE FROM public.atividades WHERE modulo_id IN (SELECT id FROM public.modulos WHERE frente_id = p_frente_id);

    FOR r_regra IN SELECT * FROM public.regras_atividades WHERE curso_id = p_curso_id LOOP
        v_contador := 0;
        FOR r_modulo IN SELECT * FROM public.modulos WHERE frente_id = p_frente_id ORDER BY numero_modulo ASC LOOP
            v_contador := v_contador + 1;
            IF v_contador >= r_regra.comecar_no_modulo THEN
                IF ((v_contador - r_regra.comecar_no_modulo) % r_regra.frequencia_modulos = 0) THEN
                    IF r_regra.acumulativo THEN
                        v_modulo_inicio := GREATEST(v_contador - r_regra.frequencia_modulos + 1, r_regra.comecar_no_modulo);
                        IF v_modulo_inicio = v_contador THEN
                            v_titulo_final := r_regra.nome_padrao || ' (Módulo ' || v_contador || ')';
                        ELSE
                            v_titulo_final := r_regra.nome_padrao || ' (Módulos ' || v_modulo_inicio || ' ao ' || v_contador || ')';
                        END IF;
                    ELSE
                        v_titulo_final := r_regra.nome_padrao;
                    END IF;
                    INSERT INTO public.atividades (modulo_id, tipo, titulo, ordem_exibicao) VALUES (r_modulo.id, r_regra.tipo_atividade, v_titulo_final, 10);
                END IF;
            END IF;
            IF r_regra.gerar_no_ultimo AND v_contador = v_total_modulos AND (v_contador < r_regra.comecar_no_modulo OR (v_contador - r_regra.comecar_no_modulo) % r_regra.frequencia_modulos <> 0) THEN
                v_titulo_final := r_regra.nome_padrao || ' (Final)';
                INSERT INTO public.atividades (modulo_id, tipo, titulo, ordem_exibicao) VALUES (r_modulo.id, r_regra.tipo_atividade, v_titulo_final, 99);
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
