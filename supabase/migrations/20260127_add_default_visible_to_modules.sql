-- Migration: Add default_visible column to module_definitions
-- Description: Allows modules to be hidden by default (opt-in instead of opt-out)
-- This enables tenant-specific modules like TobIAs for CDF only
-- Author: CopilotKit Phase 1
-- Date: 2026-01-27

-- 1. Add default_visible column to module_definitions
-- Default is true for backward compatibility (existing modules remain visible)
ALTER TABLE public.module_definitions
ADD COLUMN IF NOT EXISTS default_visible boolean NOT NULL DEFAULT true;

-- 2. Add comment
COMMENT ON COLUMN public.module_definitions.default_visible IS
    'Whether the module is visible by default for tenants without explicit configuration. If false, tenants must explicitly enable the module.';

-- 3. Set tobias to not visible by default (opt-in module)
UPDATE public.module_definitions
SET default_visible = false
WHERE id = 'tobias';

-- 4. Enable TobIAs for CDF tenant
-- The empresa_id for CDF with slug 'cdf' is: cf93a7a5-afbe-4e99-ac66-9d312a4fc140
INSERT INTO public.tenant_module_visibility (empresa_id, module_id, is_visible, custom_name)
VALUES ('cf93a7a5-afbe-4e99-ac66-9d312a4fc140', 'tobias', true, 'TobIAs')
ON CONFLICT (empresa_id, module_id)
DO UPDATE SET is_visible = true, updated_at = now();
