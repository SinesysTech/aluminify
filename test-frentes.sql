-- Script para verificar frentes de Física e Matemática
-- Execute este script no Supabase SQL Editor para verificar os dados

-- 1. Verificar todas as frentes de Física e Matemática
SELECT 
  f.id as frente_id,
  f.nome as frente_nome,
  f.curso_id,
  d.id as disciplina_id,
  d.nome as disciplina_nome,
  c.id as curso_id_verificado,
  c.nome as curso_nome
FROM frentes f
INNER JOIN disciplinas d ON f.disciplina_id = d.id
LEFT JOIN cursos c ON f.curso_id = c.id
WHERE d.id IN ('d40e20e4-7a2b-4c22-9184-a8504b9c1c6c', '53b4164b-c3cb-43e2-bb1a-ce1a1890729e')
ORDER BY d.nome, f.nome;

-- 2. Verificar módulos de cada frente
SELECT 
  f.id as frente_id,
  f.nome as frente_nome,
  d.nome as disciplina_nome,
  COUNT(m.id) as total_modulos,
  f.curso_id
FROM frentes f
INNER JOIN disciplinas d ON f.disciplina_id = d.id
LEFT JOIN modulos m ON m.frente_id = f.id
WHERE d.id IN ('d40e20e4-7a2b-4c22-9184-a8504b9c1c6c', '53b4164b-c3cb-43e2-bb1a-ce1a1890729e')
GROUP BY f.id, f.nome, d.nome, f.curso_id
ORDER BY d.nome, f.nome;

-- 3. Verificar aulas de cada frente (com prioridade >= 1)
SELECT 
  f.id as frente_id,
  f.nome as frente_nome,
  d.nome as disciplina_nome,
  COUNT(a.id) as total_aulas,
  COUNT(CASE WHEN a.prioridade >= 1 AND a.prioridade != 0 THEN 1 END) as aulas_com_prioridade
FROM frentes f
INNER JOIN disciplinas d ON f.disciplina_id = d.id
LEFT JOIN modulos m ON m.frente_id = f.id
LEFT JOIN aulas a ON a.modulo_id = m.id
WHERE d.id IN ('d40e20e4-7a2b-4c22-9184-a8504b9c1c6c', '53b4164b-c3cb-43e2-bb1a-ce1a1890729e')
GROUP BY f.id, f.nome, d.nome
ORDER BY d.nome, f.nome;

-- 4. Verificar se há frentes sem curso_id
SELECT 
  f.id as frente_id,
  f.nome as frente_nome,
  d.nome as disciplina_nome,
  f.curso_id
FROM frentes f
INNER JOIN disciplinas d ON f.disciplina_id = d.id
WHERE d.id IN ('d40e20e4-7a2b-4c22-9184-a8504b9c1c6c', '53b4164b-c3cb-43e2-bb1a-ce1a1890729e')
  AND f.curso_id IS NULL;

-- 5. Verificar módulos sem curso_id
SELECT 
  f.id as frente_id,
  f.nome as frente_nome,
  d.nome as disciplina_nome,
  m.id as modulo_id,
  m.nome as modulo_nome,
  m.curso_id
FROM frentes f
INNER JOIN disciplinas d ON f.disciplina_id = d.id
LEFT JOIN modulos m ON m.frente_id = f.id
WHERE d.id IN ('d40e20e4-7a2b-4c22-9184-a8504b9c1c6c', '53b4164b-c3cb-43e2-bb1a-ce1a1890729e')
  AND m.curso_id IS NULL;




