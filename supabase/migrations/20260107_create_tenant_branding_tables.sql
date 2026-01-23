-- Migration: Create tenant branding tables
-- Description: Tables for brand customization system allowing each empresa to customize logos, colors, and fonts
-- Author: Brand Customization System
-- Date: 2026-01-07

-- 1. Create ENUM for logo types
create type enum_logo_type as enum ('login', 'sidebar', 'favicon');

-- 2. Create tenant_branding table (main branding configuration)
create table if not exists public.tenant_branding (
    id uuid default gen_random_uuid() primary key,
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    
    -- Custom CSS for advanced customizations
    custom_css text,
    
    -- Metadata
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    created_by uuid references auth.users(id),
    updated_by uuid references auth.users(id),
    
    -- Ensure one branding config per empresa
    unique(empresa_id)
);

-- 3. Create tenant_logos table
create table if not exists public.tenant_logos (
    id uuid default gen_random_uuid() primary key,
    tenant_branding_id uuid not null references public.tenant_branding(id) on delete cascade,
    logo_type enum_logo_type not null,
    logo_url text not null,
    
    -- File metadata
    file_name text,
    file_size integer,
    mime_type text,
    
    -- Metadata
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    -- Ensure one logo per type per tenant
    unique(tenant_branding_id, logo_type)
);

-- 4. Create color_palettes table
create table if not exists public.color_palettes (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    
    -- Primary colors
    primary_color text not null,
    primary_foreground text not null,
    secondary_color text not null,
    secondary_foreground text not null,
    
    -- Support colors
    accent_color text not null,
    accent_foreground text not null,
    muted_color text not null,
    muted_foreground text not null,
    
    -- System colors
    background_color text not null,
    foreground_color text not null,
    card_color text not null,
    card_foreground text not null,
    
    -- Status colors
    destructive_color text not null,
    destructive_foreground text not null,
    
    -- Sidebar specific colors
    sidebar_background text not null,
    sidebar_foreground text not null,
    sidebar_primary text not null,
    sidebar_primary_foreground text not null,
    
    -- Metadata
    is_custom boolean default true not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    created_by uuid references auth.users(id),
    updated_by uuid references auth.users(id)
);

-- 5. Create font_schemes table
create table if not exists public.font_schemes (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    
    -- Font families (stored as JSON arrays)
    font_sans jsonb not null default '["Inter", "system-ui", "sans-serif"]'::jsonb,
    font_mono jsonb not null default '["Fira Code", "monospace"]'::jsonb,
    
    -- Font sizes (stored as JSON object)
    font_sizes jsonb not null default '{
        "xs": "0.75rem",
        "sm": "0.875rem", 
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem"
    }'::jsonb,
    
    -- Font weights (stored as JSON object)
    font_weights jsonb not null default '{
        "light": 300,
        "normal": 400,
        "medium": 500,
        "semibold": 600,
        "bold": 700
    }'::jsonb,
    
    -- Google Fonts integration
    google_fonts jsonb default '[]'::jsonb,
    
    -- Metadata
    is_custom boolean default true not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    created_by uuid references auth.users(id),
    updated_by uuid references auth.users(id)
);

-- 6. Create custom_theme_presets table
create table if not exists public.custom_theme_presets (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    
    -- References to color palette and font scheme
    color_palette_id uuid references public.color_palettes(id) on delete set null,
    font_scheme_id uuid references public.font_schemes(id) on delete set null,
    
    -- Theme customizer settings (changed from number to numeric)
    radius numeric default 0.5,
    scale numeric default 1.0,
    mode text default 'light' check (mode in ('light', 'dark')),
    
    -- Preview colors for UI (JSON array)
    preview_colors jsonb default '[]'::jsonb,
    
    -- Default preset flag
    is_default boolean default false,
    
    -- Metadata
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    created_by uuid references auth.users(id),
    updated_by uuid references auth.users(id)
);

-- 7. Add relationship between tenant_branding and color_palette/font_scheme
alter table public.tenant_branding 
add column color_palette_id uuid references public.color_palettes(id) on delete set null,
add column font_scheme_id uuid references public.font_schemes(id) on delete set null;

-- 8. Create triggers for updated_at
create trigger handle_updated_at_tenant_branding
    before update on public.tenant_branding
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at_tenant_logos
    before update on public.tenant_logos
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at_color_palettes
    before update on public.color_palettes
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at_font_schemes
    before update on public.font_schemes
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at_custom_theme_presets
    before update on public.custom_theme_presets
    for each row
    execute function public.handle_updated_at();

-- 9. Enable RLS on all tables
alter table public.tenant_branding enable row level security;
alter table public.tenant_logos enable row level security;
alter table public.color_palettes enable row level security;
alter table public.font_schemes enable row level security;
alter table public.custom_theme_presets enable row level security;

-- 10. Create RLS policies for tenant_branding
create policy "Users can view their empresa branding"
    on public.tenant_branding
    for select
    to authenticated
    using (
        empresa_id in (
            select empresa_id from public.professores where id = (select auth.uid())
            union
            select empresa_id from public.alunos_cursos ac
            join public.cursos c on ac.curso_id = c.id
            where ac.aluno_id = (select auth.uid())
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Empresa admins can manage branding"
    on public.tenant_branding
    for all
    to authenticated
    using (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = tenant_branding.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = tenant_branding.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 11. Create RLS policies for tenant_logos
create policy "Users can view their empresa logos"
    on public.tenant_logos
    for select
    to authenticated
    using (
        tenant_branding_id in (
            select id from public.tenant_branding
            where empresa_id in (
                select empresa_id from public.professores where id = (select auth.uid())
                union
                select empresa_id from public.alunos_cursos ac
                join public.cursos c on ac.curso_id = c.id
                where ac.aluno_id = (select auth.uid())
            )
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Empresa admins can manage logos"
    on public.tenant_logos
    for all
    to authenticated
    using (
        tenant_branding_id in (
            select tb.id from public.tenant_branding tb
            where exists (
                select 1 from public.professores
                where id = (select auth.uid())
                and empresa_id = tb.empresa_id
                and is_admin = true
            )
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        tenant_branding_id in (
            select tb.id from public.tenant_branding tb
            where exists (
                select 1 from public.professores
                where id = (select auth.uid())
                and empresa_id = tb.empresa_id
                and is_admin = true
            )
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 12. Create RLS policies for color_palettes
create policy "Users can view their empresa color palettes"
    on public.color_palettes
    for select
    to authenticated
    using (
        empresa_id in (
            select empresa_id from public.professores where id = (select auth.uid())
            union
            select empresa_id from public.alunos_cursos ac
            join public.cursos c on ac.curso_id = c.id
            where ac.aluno_id = (select auth.uid())
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Empresa admins can manage color palettes"
    on public.color_palettes
    for all
    to authenticated
    using (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = color_palettes.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = color_palettes.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 13. Create RLS policies for font_schemes
create policy "Users can view their empresa font schemes"
    on public.font_schemes
    for select
    to authenticated
    using (
        empresa_id in (
            select empresa_id from public.professores where id = (select auth.uid())
            union
            select empresa_id from public.alunos_cursos ac
            join public.cursos c on ac.curso_id = c.id
            where ac.aluno_id = (select auth.uid())
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Empresa admins can manage font schemes"
    on public.font_schemes
    for all
    to authenticated
    using (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = font_schemes.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = font_schemes.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 14. Create RLS policies for custom_theme_presets
create policy "Users can view their empresa theme presets"
    on public.custom_theme_presets
    for select
    to authenticated
    using (
        empresa_id in (
            select empresa_id from public.professores where id = (select auth.uid())
            union
            select empresa_id from public.alunos_cursos ac
            join public.cursos c on ac.curso_id = c.id
            where ac.aluno_id = (select auth.uid())
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Empresa admins can manage theme presets"
    on public.custom_theme_presets
    for all
    to authenticated
    using (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = custom_theme_presets.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        exists (
            select 1 from public.professores
            where id = (select auth.uid())
            and empresa_id = custom_theme_presets.empresa_id
            and is_admin = true
        )
        or
        exists (
            select 1 from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 15. Create indexes for performance
create index if not exists idx_tenant_branding_empresa_id on public.tenant_branding(empresa_id);
create index if not exists idx_tenant_logos_tenant_branding_id on public.tenant_logos(tenant_branding_id);
create index if not exists idx_tenant_logos_logo_type on public.tenant_logos(logo_type);
create index if not exists idx_color_palettes_empresa_id on public.color_palettes(empresa_id);
create index if not exists idx_font_schemes_empresa_id on public.font_schemes(empresa_id);
create index if not exists idx_custom_theme_presets_empresa_id on public.custom_theme_presets(empresa_id);
create index if not exists idx_custom_theme_presets_is_default on public.custom_theme_presets(empresa_id, is_default) where is_default = true;

-- 16. Add comments to tables
comment on table public.tenant_branding is 'Main branding configuration table for each empresa (tenant)';
comment on table public.tenant_logos is 'Stores logos for different contexts (login, sidebar, favicon) per tenant';
comment on table public.color_palettes is 'Custom color palettes that can be applied to tenant branding';
comment on table public.font_schemes is 'Custom font schemes with Google Fonts integration';
comment on table public.custom_theme_presets is 'Complete theme presets combining colors, fonts, and theme customizer settings';