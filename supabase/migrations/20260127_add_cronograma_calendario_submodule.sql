-- Migration: Add Calendario submodule to Cronograma module
-- Description: Adds the calendar view as a submodule of the schedule (cronograma) module
-- Author: Module Visibility System
-- Date: 2026-01-27

-- Add calendario submodule to cronograma module
insert into public.submodule_definitions (module_id, id, name, default_url, display_order) values
    ('cronograma', 'calendario', 'Calendário', '/cronograma/calendario', 1)
on conflict (module_id, id) do nothing;

-- Add comment
comment on column public.submodule_definitions.id is 'Stable identifier for the submodule within its parent module';
