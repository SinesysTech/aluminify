-- Script SQL para deletar todos os registros de alunos do Supabase
-- 
-- ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
-- 
-- Este script deleta:
-- 1. Todos os registros da tabela 'alunos' (que automaticamente limpa tabelas relacionadas por CASCADE)
-- 2. Todos os usuários em auth.users que são alunos
--
-- Tabelas que serão automaticamente limpas devido ao ON DELETE CASCADE:
-- - alunos_cursos (relacionamentos aluno-curso)
-- - cronogramas e cronograma_itens
-- - aulas_concluidas
--
-- Para executar:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script
-- 4. Execute

-- Primeiro, vamos ver quantos alunos existem
SELECT 
    COUNT(*) as total_alunos,
    COUNT(*) FILTER (WHERE nome_completo IS NOT NULL) as com_nome,
    COUNT(*) FILTER (WHERE nome_completo IS NULL) as sem_nome
FROM public.alunos;

-- Lista todos os alunos antes de deletar
SELECT 
    id,
    email,
    nome_completo,
    cpf,
    created_at
FROM public.alunos
ORDER BY nome_completo, email;

-- ⚠️ DESCOMENTE AS LINHAS ABAIXO PARA REALMENTE DELETAR ⚠️
-- 
-- PRIMEIRO: Deletar da tabela alunos (isso limpa automaticamente tabelas relacionadas)
-- DELETE FROM public.alunos;
--
-- SEGUNDO: Deletar usuários de auth.users que eram alunos
-- ATENÇÃO: Você precisa usar a função admin do Supabase para deletar usuários
-- No SQL Editor, você pode executar isso, mas é recomendado usar o Admin API ou o Dashboard
--
-- Para deletar via SQL (se você tiver permissões):
-- DELETE FROM auth.users 
-- WHERE id IN (
--     SELECT id FROM public.alunos
-- );
--
-- ⚠️ NOTA: Se você deletar apenas da tabela 'alunos', os usuários em auth.users 
-- permanecerão. Para uma limpeza completa, você precisará deletar os usuários 
-- manualmente no Dashboard do Supabase (Authentication > Users) ou usar o Admin API.







