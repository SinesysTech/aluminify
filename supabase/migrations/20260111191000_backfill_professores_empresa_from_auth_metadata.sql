-- Migration: Backfill professor empresa links for older signups
-- Description: Ensures users with role=professor and empresa_id in auth metadata have a matching row in public.professores
-- Date: 2026-01-11

-- This migration is intentionally idempotent.

with candidate_users as (
  select
    u.id as user_id,
    u.email,
    coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(coalesce(u.email, ''), '@', 1),
      'Novo Professor'
    ) as nome_completo,
    nullif(
      coalesce(u.raw_user_meta_data->>'empresa_id', u.raw_user_meta_data->>'empresaId'),
      ''
    )::uuid as empresa_id,
    coalesce((u.raw_user_meta_data->>'is_admin')::boolean, false) as is_admin
  from auth.users u
  where (u.raw_user_meta_data->>'role') = 'professor'
), valid_candidates as (
  select c.*
  from candidate_users c
  join public.empresas e
    on e.id = c.empresa_id
   and e.ativo = true
)
insert into public.professores (id, email, nome_completo, empresa_id, is_admin)
select
  vc.user_id,
  coalesce(vc.email, ''),
  vc.nome_completo,
  vc.empresa_id,
  vc.is_admin
from valid_candidates vc
on conflict (id) do update
set
  email = excluded.email,
  nome_completo = coalesce(nullif(public.professores.nome_completo, ''), excluded.nome_completo),
  empresa_id = coalesce(public.professores.empresa_id, excluded.empresa_id),
  is_admin = (public.professores.is_admin or excluded.is_admin),
  updated_at = now();

-- Also ensure admin users have a row in empresa_admins (non-owner by default).
insert into public.empresa_admins (empresa_id, user_id, is_owner, permissoes)
select
  vc.empresa_id,
  vc.user_id,
  false,
  '{}'::jsonb
from valid_candidates vc
where vc.is_admin = true
on conflict (empresa_id, user_id) do nothing;
