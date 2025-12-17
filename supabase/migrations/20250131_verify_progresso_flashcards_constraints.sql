-- Migration: Verificar e criar constraints para progresso_flashcards
-- Description: Garante que a tabela progresso_flashcards tem todas as constraints necessárias
-- Author: Sistema de Verificação
-- Date: 2025-01-31

-- 1. Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'progresso_flashcards'
    ) THEN
        RAISE EXCEPTION 'Tabela progresso_flashcards não existe. Execute a migration de criação primeiro.';
    END IF;
END $$;

-- 2. Verificar e criar constraint UNIQUE (aluno_id, flashcard_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'progresso_flashcards'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%aluno_id%flashcard_id%'
    ) THEN
        -- Verificar se existe constraint com nome diferente
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.table_name = 'progresso_flashcards'
            AND tc.constraint_type = 'UNIQUE'
            AND ccu.column_name IN ('aluno_id', 'flashcard_id')
            GROUP BY tc.constraint_name
            HAVING COUNT(DISTINCT ccu.column_name) = 2
        ) THEN
            -- Criar constraint UNIQUE
            ALTER TABLE public.progresso_flashcards
            ADD CONSTRAINT progresso_flashcards_aluno_flashcard_unique
            UNIQUE (aluno_id, flashcard_id);
            
            RAISE NOTICE 'Constraint UNIQUE (aluno_id, flashcard_id) criada com sucesso.';
        ELSE
            RAISE NOTICE 'Constraint UNIQUE (aluno_id, flashcard_id) já existe com nome diferente.';
        END IF;
    ELSE
        RAISE NOTICE 'Constraint UNIQUE (aluno_id, flashcard_id) já existe.';
    END IF;
END $$;

-- 3. Verificar e habilitar Row Level Security (RLS)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'progresso_flashcards'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.progresso_flashcards ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Row Level Security habilitado na tabela progresso_flashcards.';
    ELSE
        RAISE NOTICE 'Row Level Security já está habilitado.';
    END IF;
END $$;

-- 4. Verificar e criar política RLS para alunos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'progresso_flashcards'
        AND policyname = 'Alunos veem apenas seu progresso'
    ) THEN
        -- Remover políticas antigas se existirem
        DROP POLICY IF EXISTS "Alunos podem gerenciar seu progresso" ON public.progresso_flashcards;
        DROP POLICY IF EXISTS "Alunos veem apenas seu progresso" ON public.progresso_flashcards;
        
        -- Criar nova política
        CREATE POLICY "Alunos veem apenas seu progresso"
        ON public.progresso_flashcards
        FOR ALL
        USING (auth.uid() = aluno_id);
        
        RAISE NOTICE 'Política RLS "Alunos veem apenas seu progresso" criada com sucesso.';
    ELSE
        RAISE NOTICE 'Política RLS "Alunos veem apenas seu progresso" já existe.';
    END IF;
END $$;

-- 5. Verificar foreign keys
DO $$
BEGIN
    -- Verificar foreign key para alunos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'progresso_flashcards'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%aluno_id%'
    ) THEN
        RAISE WARNING 'Foreign key para aluno_id não encontrada. Verifique se a tabela alunos existe.';
    END IF;
    
    -- Verificar foreign key para flashcards
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'progresso_flashcards'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%flashcard_id%'
    ) THEN
        RAISE WARNING 'Foreign key para flashcard_id não encontrada. Verifique se a tabela flashcards existe.';
    END IF;
END $$;

-- 6. Verificar e criar índices para performance
CREATE INDEX IF NOT EXISTS idx_progresso_flashcards_aluno_id 
ON public.progresso_flashcards(aluno_id);

CREATE INDEX IF NOT EXISTS idx_progresso_flashcards_flashcard_id 
ON public.progresso_flashcards(flashcard_id);

CREATE INDEX IF NOT EXISTS idx_progresso_flashcards_data_revisao 
ON public.progresso_flashcards(data_proxima_revisao);

CREATE INDEX IF NOT EXISTS idx_progresso_flashcards_ultimo_feedback 
ON public.progresso_flashcards(ultimo_feedback)
WHERE ultimo_feedback IS NOT NULL;

-- 7. Comentários na tabela e colunas
COMMENT ON TABLE public.progresso_flashcards IS 
'Rastreia o progresso de cada aluno em cada flashcard, incluindo feedback, dificuldade e próxima revisão (SRS)';

COMMENT ON COLUMN public.progresso_flashcards.aluno_id IS 
'ID do aluno - sempre vinculado ao usuário autenticado';

COMMENT ON COLUMN public.progresso_flashcards.ultimo_feedback IS 
'Último feedback dado: 1=Errei, 2=Parcial, 3=Difícil, 4=Fácil';

-- 8. Resumo final
DO $$
DECLARE
    constraint_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Contar constraints UNIQUE
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'progresso_flashcards'
    AND constraint_type = 'UNIQUE';
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'progresso_flashcards';
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'progresso_flashcards';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verificação Completa:';
    RAISE NOTICE '  - Constraints UNIQUE: %', constraint_count;
    RAISE NOTICE '  - Políticas RLS: %', policy_count;
    RAISE NOTICE '  - Índices: %', index_count;
    RAISE NOTICE '========================================';
END $$;











