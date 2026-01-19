-- Migration: Create flashcards-images private storage bucket + RLS policies
-- Description: Adds private bucket for flashcard question/answer images and tenant-safe policies
-- Date: 2026-01-19

BEGIN;

-- 1) Create bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'flashcards-images',
  'flashcards-images',
  false,
  5242880, -- 5MB
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- 2) Drop existing policies (idempotent)
drop policy if exists "Authenticated can read flashcard images (same empresa)" on storage.objects;
drop policy if exists "Professores can upload flashcard images (same empresa)" on storage.objects;
drop policy if exists "Professores can update flashcard images (same empresa)" on storage.objects;
drop policy if exists "Professores can delete flashcard images (same empresa)" on storage.objects;

-- Expected path:
--   {empresaId}/{flashcardId}/{side}/{file}
-- Where:
--   empresaId and flashcardId are UUIDs, side ∈ {pergunta,resposta}
-- We validate with regex before casting.

-- 3) SELECT: authenticated users can read images for their empresa and flashcards in that empresa
create policy "Authenticated can read flashcard images (same empresa)"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'flashcards-images'::text
  and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/(pergunta|resposta)/'
  and (split_part(name, '/', 1))::uuid = public.get_user_empresa_id()
  and exists (
    select 1
    from public.flashcards fc
    where fc.id = (split_part(name, '/', 2))::uuid
      and fc.empresa_id = public.get_user_empresa_id()
  )
);

-- 4) INSERT: only professors can upload, restricted to their empresa and existing flashcard
create policy "Professores can upload flashcard images (same empresa)"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'flashcards-images'::text
  and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/(pergunta|resposta)/'
  and (split_part(name, '/', 1))::uuid = public.get_user_empresa_id()
  and exists (
    select 1
    from public.professores p
    where p.id = auth.uid()
      and p.empresa_id = public.get_user_empresa_id()
  )
  and exists (
    select 1
    from public.flashcards fc
    where fc.id = (split_part(name, '/', 2))::uuid
      and fc.empresa_id = public.get_user_empresa_id()
  )
);

-- 5) UPDATE: only professors can update, same rules as insert
create policy "Professores can update flashcard images (same empresa)"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'flashcards-images'::text
  and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/(pergunta|resposta)/'
  and (split_part(name, '/', 1))::uuid = public.get_user_empresa_id()
  and exists (
    select 1
    from public.professores p
    where p.id = auth.uid()
      and p.empresa_id = public.get_user_empresa_id()
  )
  and exists (
    select 1
    from public.flashcards fc
    where fc.id = (split_part(name, '/', 2))::uuid
      and fc.empresa_id = public.get_user_empresa_id()
  )
)
with check (
  bucket_id = 'flashcards-images'::text
  and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/(pergunta|resposta)/'
  and (split_part(name, '/', 1))::uuid = public.get_user_empresa_id()
  and exists (
    select 1
    from public.professores p
    where p.id = auth.uid()
      and p.empresa_id = public.get_user_empresa_id()
  )
  and exists (
    select 1
    from public.flashcards fc
    where fc.id = (split_part(name, '/', 2))::uuid
      and fc.empresa_id = public.get_user_empresa_id()
  )
);

-- 6) DELETE: only professors can delete, same rules
create policy "Professores can delete flashcard images (same empresa)"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'flashcards-images'::text
  and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/(pergunta|resposta)/'
  and (split_part(name, '/', 1))::uuid = public.get_user_empresa_id()
  and exists (
    select 1
    from public.professores p
    where p.id = auth.uid()
      and p.empresa_id = public.get_user_empresa_id()
  )
  and exists (
    select 1
    from public.flashcards fc
    where fc.id = (split_part(name, '/', 2))::uuid
      and fc.empresa_id = public.get_user_empresa_id()
  )
);

comment on column storage.buckets.id is 'flashcards-images bucket stores flashcard question/answer images (private).';

COMMIT;

