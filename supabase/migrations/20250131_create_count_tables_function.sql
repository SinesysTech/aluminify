-- Migration: Create function to count records in tables
-- Description: Função RPC para contar registros em tabelas principais (para verificação de dados)
-- Author: Auto-generated
-- Date: 2025-01-31

-- Função para contar registros em tabelas principais
CREATE OR REPLACE FUNCTION public.count_tables_records()
RETURNS TABLE (
    tabela TEXT,
    total BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'auth.users'::TEXT as tabela,
        (SELECT COUNT(*) FROM auth.users)::BIGINT as total
    UNION ALL
    SELECT 
        'public.alunos'::TEXT as tabela,
        (SELECT COUNT(*) FROM public.alunos)::BIGINT as total
    UNION ALL
    SELECT 
        'public.professores'::TEXT as tabela,
        (SELECT COUNT(*) FROM public.professores)::BIGINT as total
    UNION ALL
    SELECT 
        'public.empresa_admins'::TEXT as tabela,
        (SELECT COUNT(*) FROM public.empresa_admins)::BIGINT as total;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.count_tables_records() IS 'Retorna a contagem de registros nas tabelas principais: auth.users, public.alunos, public.professores e public.empresa_admins';




