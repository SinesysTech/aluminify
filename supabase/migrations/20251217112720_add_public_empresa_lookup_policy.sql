-- Migration: Add public lookup policy for empresas by slug
-- Description: Permite lookup público de empresa por slug para onboarding de professores
-- Author: Auto-generated
-- Date: 2025-12-17

-- Criar RLS policy: Lookup público por slug (apenas empresas ativas)
create policy "Lookup público de empresa ativa por slug"
    on public.empresas
    for select
    to anon, authenticated
    using (
        slug is not null
        and ativo = true
    );

-- Adicionar comentário explicativo
comment on policy "Lookup público de empresa ativa por slug" on public.empresas is 'Permite que usuários não autenticados busquem empresas ativas por slug para fins de onboarding. Apenas empresas ativas são retornadas.';

