-- Correção: Atualizar Nível 3 de "Desafio" para "Grandes Bancas"
-- Também atualiza a stored procedure para gerar corretamente no futuro

-- 1. Atualizar atividades existentes do tipo Nivel_3
UPDATE public.atividades
SET titulo = REPLACE(titulo, 'Lista Nível 3 (Desafio)', 'Lista Nível 3 (Grandes Bancas)')
WHERE tipo = 'Nivel_3' AND titulo LIKE '%Desafio%';

-- 2. Atualizar a stored procedure para usar "Grandes Bancas" no futuro
CREATE OR REPLACE FUNCTION public.gerar_atividades_padrao(
    p_frente_id UUID
)
RETURNS VOID AS $$
DECLARE
    r_modulo RECORD;
    v_contador INTEGER := 0;
    v_total_modulos INTEGER;
BEGIN
    -- Deletar atividades existentes da frente ANTES de criar novas
    DELETE FROM public.atividades
    WHERE modulo_id IN (
        SELECT id FROM public.modulos WHERE frente_id = p_frente_id
    );

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



