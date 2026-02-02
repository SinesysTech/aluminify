-- Migration: Rename submodule "Agendar" to "Agendar Atendimento"
-- Description: Align sidebar label with generic "atendimento" (plantão, mentoria, dúvidas, etc.)
-- Date: 2026-02-02

-- 1. Update default display name in submodule definitions
update public.submodule_definitions
set name = 'Agendar Atendimento'
where module_id = 'agendamentos' and id = 'agendar';

-- 2. Remove custom_name for all tenants on this submodule so everyone sees the new default
update public.tenant_submodule_visibility
set custom_name = null, updated_at = now()
where module_id = 'agendamentos' and submodule_id = 'agendar';
