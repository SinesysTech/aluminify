-- Migration: Harden materiais_didaticos Storage policies with empresa binding
-- Description:
-- - Only allow professors to manage files for atividades of their empresa
-- - Keeps public read policy as-is (bucket is public), but tenant boundary is enforced for writes
-- Date: 2026-01-12

BEGIN;

-- Remove existing policies (idempotent)
DROP POLICY IF EXISTS "Professores podem fazer upload de materiais" ON storage.objects;
DROP POLICY IF EXISTS "Leitura pública de materiais didáticos" ON storage.objects;
DROP POLICY IF EXISTS "Professores podem substituir materiais" ON storage.objects;
DROP POLICY IF EXISTS "Professores podem remover materiais" ON storage.objects;

-- Importante: evite cast direto (pode explodir com erro se o path for inválido).
-- Estrutura esperada: "{atividade_id}/{arquivo}"
-- Onde atividade_id é UUID.

-- INSERT: only professors, and only for atividades in same empresa
CREATE POLICY "Professores podem fazer upload de materiais"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materiais_didaticos'::text
  AND name ~ '^[0-9a-fA-F-]{36}/'
  AND EXISTS (
    SELECT 1
    FROM public.professores p
    WHERE p.id = auth.uid()
      AND p.empresa_id = public.get_user_empresa_id()
  )
  AND EXISTS (
    SELECT 1
    FROM public.atividades a
    WHERE a.id = (split_part(name, '/', 1))::uuid
      AND a.empresa_id = public.get_user_empresa_id()
  )
);

-- SELECT: keep public read (bucket is public)
CREATE POLICY "Leitura pública de materiais didáticos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'materiais_didaticos'::text);

-- UPDATE: only professors, and only for atividades in same empresa
CREATE POLICY "Professores podem substituir materiais"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'materiais_didaticos'::text
  AND name ~ '^[0-9a-fA-F-]{36}/'
  AND EXISTS (
    SELECT 1
    FROM public.professores p
    WHERE p.id = auth.uid()
      AND p.empresa_id = public.get_user_empresa_id()
  )
  AND EXISTS (
    SELECT 1
    FROM public.atividades a
    WHERE a.id = (split_part(name, '/', 1))::uuid
      AND a.empresa_id = public.get_user_empresa_id()
  )
)
WITH CHECK (
  bucket_id = 'materiais_didaticos'::text
  AND name ~ '^[0-9a-fA-F-]{36}/'
  AND EXISTS (
    SELECT 1
    FROM public.professores p
    WHERE p.id = auth.uid()
      AND p.empresa_id = public.get_user_empresa_id()
  )
  AND EXISTS (
    SELECT 1
    FROM public.atividades a
    WHERE a.id = (split_part(name, '/', 1))::uuid
      AND a.empresa_id = public.get_user_empresa_id()
  )
);

-- DELETE: only professors, and only for atividades in same empresa
CREATE POLICY "Professores podem remover materiais"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'materiais_didaticos'::text
  AND name ~ '^[0-9a-fA-F-]{36}/'
  AND EXISTS (
    SELECT 1
    FROM public.professores p
    WHERE p.id = auth.uid()
      AND p.empresa_id = public.get_user_empresa_id()
  )
  AND EXISTS (
    SELECT 1
    FROM public.atividades a
    WHERE a.id = (split_part(name, '/', 1))::uuid
      AND a.empresa_id = public.get_user_empresa_id()
  )
);

COMMIT;

