-- Migration: Fix RLS policies for disciplinas to handle multi-tenancy and shared data
-- Date: 2026-01-18
-- Description: Updates the SELECT policy on public.disciplinas to allow users to see:
-- 1. Shared disciplines (empresa_id IS NULL)
-- 2. Disciplines belonging to their own company (empresa_id = user's company)
-- 3. All disciplines if superadmin

-- Drop existing SELECT policies to avoid conflicts
drop policy if exists "Catálogo de Disciplinas é Público" on public.disciplinas;
drop policy if exists "Disciplinas visíveis por tenant ou públicas" on public.disciplinas;

-- Create the new comprehensive SELECT policy
create policy "Disciplinas visíveis por tenant ou públicas"
  on public.disciplinas
  for select
  using (
    -- 1. Public/Shared disciplines (catalog)
    empresa_id is null
    or
    -- 2. Authenticated user sees disciplines from their own company
    (
      auth.role() = 'authenticated' and (
        -- Check if discipline belongs to user's company
        empresa_id = public.get_user_empresa_id()
        or
        -- Superadmin sees everything
        public.is_superadmin()
      )
    )
  );

-- Ensure index exists for performance (idempotent)
create index if not exists idx_disciplinas_empresa_id_null 
  on public.disciplinas(id) 
  where empresa_id is null;
