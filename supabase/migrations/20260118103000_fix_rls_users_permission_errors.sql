-- Migration: Fix permission denied for auth.users ("users") triggered by RLS policy expressions
-- Date: 2026-01-18
-- Why:
-- - Some RLS policies referenced auth.users directly (or indirectly), which authenticated roles cannot SELECT.
-- - cursos_disciplinas had a FOR ALL policy that was being evaluated during SELECTs, causing permission errors
--   even though there was also a public SELECT policy.

-- 1) Fix professores SELECT policy to avoid auth.users access
drop policy if exists "Professores veem apenas professores da mesma empresa" on public.professores;

create policy "Professores veem apenas professores da mesma empresa"
  on public.professores
  for select
  to authenticated
  using (
    -- Fast path: user sees their own record
    id = (select auth.uid())
    or
    -- Colleagues from the same company
    empresa_id = public.get_user_empresa_id()
    or
    -- Superadmin (via JWT helper, no auth.users access)
    public.is_superadmin()
  );

-- 2) Fix cursos_disciplinas policies: keep SELECT public, but avoid evaluating "professor check" during SELECT
-- Drop the old FOR ALL policy (it was affecting SELECT too)
drop policy if exists "Professores gerenciam relações curso-disciplina" on public.cursos_disciplinas;

-- Ensure SELECT stays public (it may already exist; keep idempotent)
drop policy if exists "Relações curso-disciplina são públicas" on public.cursos_disciplinas;
create policy "Relações curso-disciplina são públicas"
  on public.cursos_disciplinas
  for select
  using (true);

-- Only professors can manage (INSERT/UPDATE/DELETE)
create policy "Professores inserem relações curso-disciplina"
  on public.cursos_disciplinas
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.professores
      where id = (select auth.uid())
    )
  );

create policy "Professores atualizam relações curso-disciplina"
  on public.cursos_disciplinas
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.professores
      where id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.professores
      where id = (select auth.uid())
    )
  );

create policy "Professores deletam relações curso-disciplina"
  on public.cursos_disciplinas
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.professores
      where id = (select auth.uid())
    )
  );

