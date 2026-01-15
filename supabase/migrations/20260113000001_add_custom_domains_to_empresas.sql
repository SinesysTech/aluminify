-- Migration: Add custom domain support to empresas table
-- Description: Adds fields for custom domains and subdomains for multi-tenant routing

-- Adicionar campos de domínio customizado
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS dominio_customizado TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_empresas_dominio_customizado
  ON public.empresas(dominio_customizado)
  WHERE dominio_customizado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_empresas_subdomain
  ON public.empresas(subdomain)
  WHERE subdomain IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.empresas.dominio_customizado IS
  'Domínio customizado completo (ex: escola.com.br)';
COMMENT ON COLUMN public.empresas.subdomain IS
  'Subdomínio no domínio principal (ex: escola em escola.alumnify.com.br)';
