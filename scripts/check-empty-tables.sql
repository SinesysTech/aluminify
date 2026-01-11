-- Script para verificar se as tabelas estão vazias
-- Tabelas a verificar:
-- 1. auth.users (usuários de autenticação)
-- 2. public.alunos (alunos)
-- 3. public.professores (professores)
-- 4. public.empresa_admins (administradores de empresas)

-- Verificar auth.users
SELECT 
    'auth.users' as tabela,
    COUNT(*) as total_registros
FROM auth.users;

-- Verificar public.alunos
SELECT 
    'public.alunos' as tabela,
    COUNT(*) as total_registros
FROM public.alunos;

-- Verificar public.professores
SELECT 
    'public.professores' as tabela,
    COUNT(*) as total_registros
FROM public.professores;

-- Verificar public.empresa_admins
SELECT 
    'public.empresa_admins' as tabela,
    COUNT(*) as total_registros
FROM public.empresa_admins;

-- Resumo geral
SELECT 
    'RESUMO' as tipo,
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM public.alunos) as alunos,
    (SELECT COUNT(*) FROM public.professores) as professores,
    (SELECT COUNT(*) FROM public.empresa_admins) as empresa_admins;




