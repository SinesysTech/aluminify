-- Políticas RLS para o bucket 'materiais_didaticos'
-- IMPORTANTE: Execute estas políticas APÓS criar o bucket 'materiais_didaticos' no Supabase Dashboard
--
-- Para criar o bucket:
-- 1. Supabase Dashboard > Storage > Create bucket > Nome: "materiais_didaticos" > Public: true
-- 2. Depois de criar o bucket, execute este arquivo para configurar as políticas RLS
--
-- Estrutura de pastas: {atividade_id}/{timestamp}-{nome_original}.pdf

-- Remover políticas antigas se existirem (para evitar conflito ao re-executar)
DROP POLICY IF EXISTS "Professores podem fazer upload de materiais" ON storage.objects;
DROP POLICY IF EXISTS "Leitura pública de materiais didáticos" ON storage.objects;
DROP POLICY IF EXISTS "Professores podem substituir materiais" ON storage.objects;
DROP POLICY IF EXISTS "Professores podem remover materiais" ON storage.objects;

-- Política para permitir que professores façam upload de materiais
-- Os arquivos são nomeados como: {atividade_id}/{timestamp}-{nome}.pdf
CREATE POLICY "Professores podem fazer upload de materiais"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materiais_didaticos'::text
  AND EXISTS (SELECT 1 FROM public.professores WHERE id = auth.uid())
);

-- Política para permitir leitura pública de materiais
CREATE POLICY "Leitura pública de materiais didáticos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'materiais_didaticos'::text);

-- Política para permitir que professores substituam materiais (UPDATE)
-- Professores podem atualizar arquivos em pastas de atividades que existem
CREATE POLICY "Professores podem substituir materiais"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'materiais_didaticos'::text
  AND EXISTS (SELECT 1 FROM public.professores WHERE id = auth.uid())
)
WITH CHECK (
  bucket_id = 'materiais_didaticos'::text
  AND EXISTS (SELECT 1 FROM public.professores WHERE id = auth.uid())
);

-- Política para permitir que professores removam materiais
CREATE POLICY "Professores podem remover materiais"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'materiais_didaticos'::text
  AND EXISTS (SELECT 1 FROM public.professores WHERE id = auth.uid())
);

