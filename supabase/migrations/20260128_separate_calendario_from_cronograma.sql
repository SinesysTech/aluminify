-- Migration: Separate Calendario from Cronograma module
-- Description: Makes Calendario a separate top-level module instead of submodule of Cronograma
-- Author: Module Visibility System
-- Date: 2026-01-28

-- 1. Remove calendario as submodule of cronograma
delete from public.submodule_definitions
where module_id = 'cronograma' and id = 'calendario';

-- 2. Add calendario as a separate top-level module
-- Using display_order 4 to place it right after cronograma (which is 3)
insert into public.module_definitions (id, name, description, icon_name, default_url, display_order, is_core) values
    ('calendario', 'Calendário', 'Visualização do cronograma de estudos em formato de calendário', 'CalendarDays', '/cronograma/calendario', 4, false)
on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    icon_name = excluded.icon_name,
    default_url = excluded.default_url,
    display_order = excluded.display_order;

-- 3. Update display_order of modules that come after cronograma to make room
update public.module_definitions
set display_order = display_order + 1
where display_order >= 4 and id != 'calendario';

-- 4. Also remove any tenant-specific submodule visibility configs for calendario
delete from public.tenant_submodule_visibility
where module_id = 'cronograma' and submodule_id = 'calendario';

-- Add comment
comment on column public.module_definitions.id is 'Stable identifier for the module';
